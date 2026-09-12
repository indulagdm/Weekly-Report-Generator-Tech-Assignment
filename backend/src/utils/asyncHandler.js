// Wraps an async controller so thrown/rejected errors are forwarded
// to Express's error-handling middleware instead of crashing the process.
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
