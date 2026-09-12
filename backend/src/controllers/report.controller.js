const reportService = require("../services/report.service");
const { ApiError, ok } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { getPagination, buildMeta } = require("../utils/pagination");
const { pool } = require("../config/database");

const ensureProjectAccess = async (req, projectId) => {
  if (req.user.role === "manager") return;
  const [projects] = await pool.execute(
    `SELECT p.id
     FROM projects p
     INNER JOIN user_projects up ON up.project_id = p.id
     WHERE p.id = ? AND up.user_id = ? AND p.is_active = TRUE
     LIMIT 1`,
    [projectId, req.user.id],
  );
  if (!projects.length) {
    throw new ApiError(403, "You are not assigned to this project");
  }
};

// Loads a report and enforces "team members may only see/act on their
// own reports; managers may see (but not edit content of) any report".
// This is the single choke point all report routes go through, so the
// access rule lives in exactly one place.
const loadReportForAccess = async (req, { requireOwner = false } = {}) => {
  try {
    const queryForGetReport = `SELECT * FROM reports WHERE id = ?`;
    const [resultForGetReport] = await pool.execute(queryForGetReport, [
      req.params.id,
    ]);
    if (resultForGetReport.length === 0) {
      throw new ApiError(404, "Report not found");
    }
    const report = resultForGetReport[0];

    const isOwner = report.user_id === req.user.id;
    const isManager = req.user.role === "manager";

    if (!isOwner && !isManager) {
      throw new ApiError(
        403,
        "You do not have access to another team member's report",
      );
    }
    if (requireOwner && !isOwner) {
      throw new ApiError(403, "Only the report owner can edit report content");
    }
    return report;
  } catch (error) {
    throw new ApiError(500, "Failed to load report for access");
  }
};

// POST /api/reports - team member creates a new draft for a week.
const createReport = asyncHandler(async (req, res) => {
  try {
    const { week_start_date, week_end_date } = req.body;
    await ensureProjectAccess(req, req.body.project_id);
    if (new Date(week_end_date) < new Date(week_start_date)) {
      throw new ApiError(400, "week_end_date cannot be before week_start_date");
    }

    const queryForExistingReport = `SELECT * FROM reports WHERE user_id = ? AND week_start_date = ?`;
    const [resultForExistingReport] = await pool.execute(
      queryForExistingReport,
      [req.user.id, week_start_date],
    );
    if (resultForExistingReport.length > 0) {
      throw new ApiError(
        409,
        "A report for this week already exists. Edit that one instead.",
      );
    }

    const report = await reportService.createReport(req.user.id, req.body);
    ok(res, report, undefined, 201);
  } catch (error) {
    throw new ApiError(500, "Failed to create report");
  }
});

// GET /api/reports - "own report history" for a team member.
// Managers hitting this endpoint get their own reports too (if they
// file any); the full cross-team view is GET /api/review/reports.
const listMyReports = asyncHandler(async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const conditions = ["user_id = ?"];
    const params = [req.user.id];
    for (const [field, value] of [["status", req.query.status], ["project_id", req.query.project_id], ["week_start_date", req.query.week_start_date]]) {
      if (value) { conditions.push(`${field} = ?`); params.push(value); }
    }
    if (req.query.from) { conditions.push("week_start_date >= ?"); params.push(req.query.from); }
    if (req.query.to) { conditions.push("week_start_date <= ?"); params.push(req.query.to); }
    const whereClause = conditions.join(" AND ");
    const [rows] = await pool.execute(`SELECT * FROM reports WHERE ${whereClause} ORDER BY week_start_date DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    const [countRows] = await pool.execute(`SELECT COUNT(*) AS count FROM reports WHERE ${whereClause}`, params);
    ok(res, rows, buildMeta({ page, limit, total: Number(countRows[0].count) }));
  } catch (error) {
    throw new ApiError(500, "Failed to list reports");
  }
});

// GET /api/reports/:id - full detail incl. all versions (owner or manager).
const getReport = asyncHandler(async (req, res) => {
  try {
    const report = await loadReportForAccess(req);
    ok(res, report);
  } catch (error) {
    throw new ApiError(500, "Failed to get report");
  }
});

// PUT /api/reports/:id - edit content. Owner only, and only while
// draft/needs_correction (enforced in the service layer).
const updateReport = asyncHandler(async (req, res) => {
  try {
    const report = await loadReportForAccess(req, { requireOwner: true });
    if (req.body.project_id) await ensureProjectAccess(req, req.body.project_id);
    const updated = await reportService.updateReportContent(report.id, req.body);
    ok(res, updated);
  } catch (error) {
    throw new ApiError(500, "Failed to update report");
  }
});

// POST /api/reports/:id/submit
const submitReport = asyncHandler(async (req, res) => {
  try {
    const report = await loadReportForAccess(req, { requireOwner: true });
    const updated = await reportService.submitReport(report.id);
    ok(res, updated);
  } catch (error) {
    throw new ApiError(500, "Failed to submit report");
  }
});

// GET /api/reports/:id/versions - version history list (Section 3 bonus).
const listVersions = asyncHandler(async (req, res) => {
  try {
    const report = await loadReportForAccess(req);
    const versions = report.versions
      .map((v) => ({
        id: v.id,
        version_number: v.version_number,
        submitted_at: v.submitted_at,
        created_at: v.created_at,
      }))
      .sort((a, b) => a.version_number - b.version_number);
    ok(res, versions);
  } catch (error) {
    throw new ApiError(500, "Failed to list versions");
  }
});

// GET /api/reports/:id/versions/:versionId - one version's full content.
const getVersion = asyncHandler(async (req, res) => {
  try {
    const report = await loadReportForAccess(req);
    const version = report.versions.find(
      (v) => String(v.id) === req.params.versionId,
    );
    if (!version) throw new ApiError(404, "Version not found on this report");
    ok(res, version);
  } catch (error) {
    throw new ApiError(500, "Failed to get version");
  }
});

module.exports = {
  createReport,
  listMyReports,
  getReport,
  updateReport,
  submitReport,
  listVersions,
  getVersion,
};
