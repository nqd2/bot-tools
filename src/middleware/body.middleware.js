const express = require('express');
const { JSON_BODY_LIMIT } = require('../constants/limits');
const logsService = require('../services/logs.service');

const jsonParser = express.json({ limit: JSON_BODY_LIMIT });

function jsonBodyMiddleware(req, res, next) {
  jsonParser(req, res, (error) => {
    if (error && error.type === 'entity.too.large') {
      logsService.writeLog({
        level: 'error',
        source: 'openrouter',
        event: 'payload_too_large',
        message: `Body exceeds ${JSON_BODY_LIMIT}`,
        meta: {
          contentLength: req.headers['content-length'],
          path: req.path,
        },
      });
      return res.status(413).json({
        error: 'Payload too large',
        hint: 'Cursor traces with full context can be large; limit increased — redeploy required.',
      });
    }
    return next(error);
  });
}

module.exports = {
  jsonBodyMiddleware,
};
