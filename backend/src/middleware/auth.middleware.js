const { verifyToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiResponse");
const { pool } = require("../config/database");

// Verifies the JWT on the Authorization header and attaches the
// authenticated user (fresh from the DB, so a deactivated/deleted
// user or a role change takes effect immediately) to req.user.
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new ApiError(401, "Missing or malformed Authorization header");
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired token");
    }

    const queryForExistUser =  `SELECT * FROM users WHERE id = ? LIMIT 1`;
    const [resultForExistUser] = await pool.execute(queryForExistUser, [payload.sub]);
    if (resultForExistUser.length === 0) {
      throw new ApiError(401, "User no longer exists");
    }

    const user = resultForExistUser[0];
    if (!user || !user.is_active) {
      throw new ApiError(401, "User no longer exists or is inactive");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// authorize('manager') restricts a route to specific roles.
// Every route not wrapped in this is available to any authenticated user.
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Not authenticated"));
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to perform this action"),
      );
    }
    next();
  };
};

module.exports = { authenticate, authorize };
