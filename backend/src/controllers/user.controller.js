const { ApiError, ok } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { getPagination, buildMeta } = require("../utils/pagination");
const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");
const { v4: uuid4 } = require("uuid");

// Manager-only: user management page (Section 7).
const listUsers = asyncHandler(async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);

    const conditions = [];
    const params = [];

    // Role filter
    if (req.query.role) {
      conditions.push("role = ?");
      params.push(req.query.role);
    }

    // Search filter
    if (req.query.search) {
      conditions.push("(name LIKE ? OR email LIKE ?)");
      const search = `%${req.query.search}%`;

      params.push(search, search);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get paginated users
    const [rows] = await pool.execute(
      `
  SELECT
    id,
    name,
    email,
    role,
    is_active,
    created_at,
    updated_at
  FROM users
  ${whereClause}
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
  `,
      [...params, limit, offset],
    );

    // Get total count
    const [countRows] = await pool.execute(
      `
  SELECT COUNT(*) AS count
  FROM users
  ${whereClause}
  `,
      params,
    );

    const count = Number(countRows[0].count);

    ok(res, rows, buildMeta({ page, limit, total: count }));
  } catch (error) {
    throw new ApiError(500, "Failed to list users");
  }
});

// Manager invites a new team member/manager directly (they get a
// password to log in with; a production system would email an invite
// link instead - see backend report for the tradeoff).
const inviteUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, title, role } = req.body;
    
    console.log("Invite user request body:", req.body); // Log the request body for debugging

    const queryForExistingUser = `SELECT * FROM users WHERE email = ?`;
    const [resultForExistingUser] = await pool.execute(queryForExistingUser, [
      email,
    ]);
    if (resultForExistingUser.length > 0) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const password = name.trim().split(" ")[0].toLowerCase() + "123"; // Simple password generation for demo purposes

    const queryForInsertUser = `INSERT INTO users (id, name, email, title, password, role) VALUES (?, ?, ?, ?, ?, ?)`;

    const hashPassword = await bcrypt.hash(password, 12);

    const userId = uuid4();
    const [resultForInsertUser] = await pool.execute(queryForInsertUser, [
      userId,
      name,
      email,
      title,
      hashPassword,
      role,
    ]);
    if (resultForInsertUser.affectedRows === 0) {
      throw new ApiError(500, "Failed to create user");
    }

    const [createdUsers] = await pool.execute(
      "SELECT id, name, email, title, role, is_active, created_at FROM users WHERE id = ?",
      [userId],
    );
    ok(res, createdUsers[0], undefined, 201);
  } catch (error) {
    throw new ApiError(500, "Failed to invite user");
  }
});

const updateUser = asyncHandler(async (req, res) => {
  try {
    const queryForUser = `SELECT * FROM users WHERE id = ?`;
    const [resultForUser] = await pool.execute(queryForUser, [req.params.id]);
    if (resultForUser.length === 0) {
      throw new ApiError(404, "User not found");
    }
    const user = resultForUser[0];

    const { name, role, title, is_active } = req.body;

    const queryForUpdateUser = `UPDATE users SET name = ?, role = ?, title = ?, is_active = ? WHERE id = ?`;
    await pool.execute(queryForUpdateUser, [
      name ?? user.name,
      role ?? user.role,
      title ?? user.title,
      typeof is_active === "boolean" ? is_active : user.is_active,
      req.params.id,
    ]);

    const [updatedUsers] = await pool.execute("SELECT id, name, email, title, role, is_active, created_at, updated_at FROM users WHERE id = ?", [req.params.id]);
    ok(res, updatedUsers[0]);
  } catch (error) {
    throw new ApiError(500, "Failed to update user");
  }
});

// "Remove" a team member = deactivate rather than hard-delete, so their
// historical reports (and the manager's review history of them) stay intact.
const removeUser = asyncHandler(async (req, res) => {
  try {
    const queryForUser = `SELECT * FROM users WHERE id = ?`;
    const [resultForUser] = await pool.execute(queryForUser, [req.params.id]);
    if (resultForUser.length === 0) {
      throw new ApiError(404, "User not found");
    }
    const user = resultForUser[0];

    if (user.id === req.user.id) {
      throw new ApiError(400, "You cannot remove your own account");
    }

    await pool.execute("UPDATE users SET is_active = FALSE WHERE id = ?", [req.params.id]);
    ok(res, { message: "User deactivated" });
  } catch (error) {
    throw new ApiError(500, "Failed to remove user");
  }
});

module.exports = { listUsers, inviteUser, updateUser, removeUser };
