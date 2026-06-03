/**
 * Global error handler middleware.
 */
function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Async wrapper — catches promise rejections and forwards to errorHandler.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create a standard API error.
 */
function createError(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorHandler, asyncHandler, createError };
