const { signToken } = require("../utils/jwt");
const { ApiError, ok } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { v4: uuidv4 } = require("uuid");
const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");

// Public self-registration. Role defaults to team_member; allowing a
// caller to request "manager" here is a deliberate simplification for
// this assignment (see backend report). In a real product this would
// be admin-only (see user.controller.js#inviteUser for that path).
const register = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const queryForExistingUser = "SELECT * FROM users WHERE email = ?";
    const [resultForExistingUser] = await pool.execute(queryForExistingUser, [
      email,
    ]);
    if (resultForExistingUser.length > 0) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const userId = uuidv4();

    const hashPassword = await bcrypt.hash(password, 12);

    const queryForNewUser = `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`;
    const [resultForNewUser] = await pool.execute(queryForNewUser, [
      userId,
      name,
      email,
      hashPassword,
      role === "manager" ? "manager" : "team_member",
    ]);

    if (resultForNewUser.affectedRows === 0) {
      throw new ApiError(500, "Failed to create user");
    }

    const [createdUsers] = await pool.execute(
      "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?",
      [userId],
    );
    const createdUser = createdUsers[0];
    const token = signToken({ sub: userId, role: createdUser.role });
    ok(res, { token, user: createdUser }, undefined, 201);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to register user");
  }
});

const login = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const queryForExistUser = `SELECT * FROM users WHERE email = ? LIMIT 1`;
    const [resultForExistUser] = await pool.execute(queryForExistUser, [email]);
    if (resultForExistUser.length === 0) {
      throw new ApiError(401, "Invalid email or password");
    }

    const user = resultForExistUser[0];
  
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = signToken({ sub: user.id, role: user.role });

    ok(res, { token, user: user });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to login user");
  }
});

// JWTs are stateless, so "logout" is a client-side concern (discard
// the token). This endpoint exists for API completeness / so a
// frontend has something to call.
const logout = asyncHandler(async (req, res) => {
  ok(res, { message: "Logged out. Discard the token client-side." });
});

const me = asyncHandler(async (req, res) => {
  ok(res, { user: req.user });
});

module.exports = { register, login, logout, me };
