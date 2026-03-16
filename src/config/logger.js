const winston = require('winston');

const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  let output = `${timestamp} [${level}]: ${message}`;
  
  const metaObject = { ...meta };
  delete metaObject.service;
  
  if (Object.keys(metaObject).length > 0) {
    output += `\n${JSON.stringify(metaObject, null, 2)}`;
  }
  
  return output;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production' 
      ? winston.format.json() 
      : winston.format.combine(
          winston.format.colorize(),
          customFormat
        )
  ),
  defaultMeta: { service: 'bot-tools' },
  transports: [new winston.transports.Console()],
});

module.exports = logger;
