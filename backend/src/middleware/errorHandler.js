const logger = require('../utils/logger');

function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `That ${field || 'value'} is already in use`;
  }
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'File is too large (max 5 MB)';
  }
  if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  }

  if (status >= 500) logger.error({ err, url: req.originalUrl }, 'unhandled error');
  const hideDetails = process.env.NODE_ENV === 'production' && status >= 500;
  res.status(status).json({
    success: false,
    message: hideDetails ? 'Something went wrong. Please try again.' : message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
