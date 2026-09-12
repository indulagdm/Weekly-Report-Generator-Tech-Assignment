const { validationResult } = require("express-validator");
const { ApiError } = require("../utils/apiResponse");

// Runs after an array of express-validator checks and turns any
// failures into a single, consistent 400 ApiError.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, "Validation failed", errors.array()));
  }
  next();
};

module.exports = validate;
