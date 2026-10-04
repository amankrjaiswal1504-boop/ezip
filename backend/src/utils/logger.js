const pino = require('pino');

// Structured JSON logs in production; quiet in tests. Sentry-ready: forward
// error-level logs to Sentry (or any APM) by adding a transport here.
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
  redact: ['req.headers.authorization', 'req.headers.cookie', 'password', 'otp', 'token'],
  base: { service: 'scrapmate-api' },
});

module.exports = logger;
