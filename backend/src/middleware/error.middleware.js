const { ApiError } = require("../utils/apiResponse");

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Central error handler. Sequelize validation/unique-constraint errors
// are translated into clean 400/409 responses; everything else falls
// back to 500 without leaking internals in production.
const errorHandler = (err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err instanceof ApiError ? err.details : undefined;

  if (err.name === "SequelizeValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = err.errors.map((e) => ({ field: e.path, message: e.message }));
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    statusCode = 409;
    message = "A record with these values already exists";
    details = err.errors.map((e) => ({ field: e.path, message: e.message }));
  }

  if (process.env.NODE_ENV !== "test" && statusCode === 500) {
    console.error(err); // eslint-disable-line no-console
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
};

module.exports = { notFoundHandler, errorHandler };
