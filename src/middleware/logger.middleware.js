const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

const loggingMiddleware = (req, res, next) => {
    // Generate Correlation ID if missing
    req.id = req.headers['x-correlation-id'] || uuidv4();
    res.setHeader('x-correlation-id', req.id);

    const startTime = Date.now();

    // Log Request
    const requestLogPayload = {
        message: 'Incoming Request',
        method: req.method,
        url: req.url,
        correlationId: req.id,
        ip: req.ip
    };

    if (Object.keys(req.query || {}).length > 0) {
        requestLogPayload.query = req.query;
    }
    if (Object.keys(req.body || {}).length > 0) {
        requestLogPayload.body = req.body;
    }

    logger.info(requestLogPayload);

    // Capture Response
    const originalSend = res.send;
    let responseBody;

    res.send = function (body) {
        responseBody = body;
        originalSend.call(this, body);
    };

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        const responseLogPayload = {
            message: 'Request Completed',
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: duration,
            correlationId: req.id
        };

        if (responseBody) {
            try {
                responseLogPayload.responseBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
            } catch {
                responseLogPayload.responseBody = responseBody;
            }
        }

        logger.info(responseLogPayload);
    });

    next();
};

module.exports = loggingMiddleware;
