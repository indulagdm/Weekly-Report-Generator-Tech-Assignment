const { ApiError, ok } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { getPagination, buildMeta } = require("../utils/pagination");
const { pool } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

const listProjects = asyncHandler(async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const isActive = req.query.is_active === undefined
      ? true
      : req.query.is_active === "true";

    const memberFilter = req.user.role === "manager"
      ? ""
      : "AND EXISTS (SELECT 1 FROM user_projects up WHERE up.project_id = projects.id AND up.user_id = ?)";
    const queryForProjects = `
  SELECT *
  FROM projects
  WHERE is_active = ? ${memberFilter}
  ORDER BY name ASC
  LIMIT ? OFFSET ?
`;

    const queryForCountAllProjects = `
  SELECT COUNT(*) AS count
  FROM projects
  WHERE is_active = ? ${memberFilter}
`;

    const memberParams = req.user.role === "manager" ? [] : [req.user.id];
    const [rowsResult] = await pool.execute(queryForProjects, [
      isActive,
      ...memberParams,
      limit,
      offset,
    ]);

    const [countResult] = await pool.execute(queryForCountAllProjects, [
      isActive,
      ...memberParams,
    ]);

    const rows = rowsResult;
    const count = Number(countResult[0].count);

    ok(res, rows, buildMeta({ page, limit, total: count }));
  } catch (error) {
    throw new ApiError(500, "Failed to list projects");
  }
});

const getProject = asyncHandler(async (req, res) => {
  try {
    const memberFilter = req.user.role === "manager"
      ? ""
      : "AND EXISTS (SELECT 1 FROM user_projects access_up WHERE access_up.project_id = p.id AND access_up.user_id = ?)";
    const query = `
    SELECT
      p.id,
      p.name,
      p.description,
      p.is_active,
      p.created_at,
      p.updated_at,

      u.id AS member_id,
      u.name AS member_name,
      u.email AS member_email,
      u.role AS member_role

    FROM projects p

    LEFT JOIN user_projects up
      ON up.project_id = p.id

    LEFT JOIN users u
      ON u.id = up.user_id

    WHERE p.id = ? ${memberFilter}
  `;

    const [rows] = await pool.execute(query, req.user.role === "manager"
      ? [req.params.id]
      : [req.params.id, req.user.id]);

    if (rows.length === 0) {
      throw new ApiError(404, "Project not found");
    }

    const project = {
      id: rows[0].id,
      name: rows[0].name,
      description: rows[0].description,
      is_active: rows[0].is_active,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,

      members: rows
        .filter((row) => row.member_id !== null)
        .map((row) => ({
          id: row.member_id,
          name: row.member_name,
          email: row.member_email,
          role: row.member_role,
        })),
    };

    ok(res, project);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to get project");
  }
});

const createProject = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;

    const queryForExistProject = `SELECT * FROM projects WHERE name = ? LIMIT 1`;
    const [resultForExistProject] = await pool.execute(queryForExistProject, [
      name,
    ]);
    if (resultForExistProject.length > 0) {
      throw new ApiError(409, "A project with this name already exists");
    }

    const projectId = uuidv4();
    const queryForNewProject = `INSERT INTO projects (id, name, description) VALUES (?, ?, ?)`;
    const [resultForNewProject] = await pool.execute(queryForNewProject, [
      projectId,
      name,
      description,
    ]);

    if (resultForNewProject.affectedRows === 0) {
      throw new ApiError(500, "Failed to create project");
    }
    const [created] = await pool.execute("SELECT * FROM projects WHERE id = ?", [projectId]);
    ok(res, created[0], undefined, 201);
  } catch (error) {
    throw new ApiError(500, "Failed to create project");
  }
});

const updateProject = asyncHandler(async (req, res) => {
  try {
    const queryForExistProject = `SELECT * FROM projects WHERE id = ? LIMIT 1`;
    const [resultForExistProject] = await pool.execute(queryForExistProject, [
      req.params.id,
    ]);
    if (resultForExistProject.length === 0) {
      throw new ApiError(404, "Project not found");
    }

    const project = resultForExistProject[0];
    const { name, description, is_active } = req.body;

    const queryForUpdateProject = `UPDATE projects SET name = ?, description = ?, is_active = ? WHERE id = ?`;
    const [resultForUpdateProject] = await pool.execute(queryForUpdateProject, [
      name ?? project.name,
      description === undefined ? project.description : description,
      typeof is_active === "boolean" ? is_active : project.is_active,
      req.params.id,
    ]);
    if (resultForUpdateProject.affectedRows === 0) {
      throw new ApiError(500, "Failed to update project");
    }

    const queryForUpdatedProject = `SELECT * FROM projects WHERE id = ? LIMIT 1`;
    const [updatedProjectResult] = await pool.execute(queryForUpdatedProject, [
      req.params.id,
    ]);
    if (updatedProjectResult.length === 0) {
      throw new ApiError(404, "Project not found after update");
    }
    const updatedProject = updatedProjectResult[0];

    ok(res, updatedProject);
  } catch (error) {
    throw new ApiError(500, "Failed to update project");
  }
});

const deleteProject = asyncHandler(async (req, res) => {
  try {
    const queryForExistProject = `SELECT * FROM projects WHERE id = ? LIMIT 1`;
    const [resultForExistProject] = await pool.execute(queryForExistProject, [
      req.params.id,
    ]);
    if (resultForExistProject.length === 0) {
      throw new ApiError(404, "Project not found");
    }

    const queryForDeleteProject = `DELETE FROM projects WHERE id = ?`;
    const [resultForDeleteProject] = await pool.execute(queryForDeleteProject, [
      req.params.id,
    ]);
    if (resultForDeleteProject.affectedRows === 0) {
      throw new ApiError(500, "Failed to delete project");
    }

    ok(res, { message: "Project deleted" });
  } catch (error) {
    throw new ApiError(500, "Failed to delete project");
  }
});

const assignMember = asyncHandler(async (req, res) => {
  try {
    const [projects] = await pool.execute("SELECT id FROM projects WHERE id = ?", [req.params.id]);
    if (!projects.length) throw new ApiError(404, "Project not found");
    const [users] = await pool.execute("SELECT id FROM users WHERE id = ? AND is_active = TRUE", [req.body.userId]);
    if (!users.length) throw new ApiError(404, "User not found");
    await pool.execute(
      "INSERT INTO user_projects (id, user_id, project_id) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM user_projects WHERE user_id = ? AND project_id = ?)",
      [uuidv4(), req.body.userId, req.params.id, req.body.userId, req.params.id],
    );
    ok(res, { message: "Member assigned to project" });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to assign member to project");
  }
});

const removeMember = asyncHandler(async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM user_projects WHERE project_id = ? AND user_id = ?",
      [req.params.id, req.params.userId],
    );
    if (result.affectedRows === 0) throw new ApiError(404, "Member is not assigned to this project");
    ok(res, { message: "Member removed from project" });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to remove project member");
  }
});

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  assignMember,
  removeMember,
};
