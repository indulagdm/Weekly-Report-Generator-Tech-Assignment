const reportService = require("../services/report.service");
const { ApiError, ok } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { getPagination, buildMeta } = require("../utils/pagination");
const { pool } = require("../config/database");

// GET /api/review/reports - Team Dashboard list (Section 4). Manager-only
// (enforced by route middleware). Supports every filter Section 4 asks for.
const listTeamReports = asyncHandler(async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where = {};

    if (req.query.user_id) where.user_id = req.query.user_id;
    if (req.query.project_id) where.project_id = req.query.project_id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.week_start_date)
      where.week_start_date = req.query.week_start_date;
    if (req.query.from || req.query.to) {
      where.week_start_date = {
        ...(req.query.from ? { [Op.gte]: req.query.from } : {}),
        ...(req.query.to ? { [Op.lte]: req.query.to } : {}),
      };
    }

    const status = req.query.status || "submitted";
    const queryForReports = `
  SELECT
    r.id,
    r.user_id,
    r.project_id,
    r.week_start_date,
    r.week_end_date,
    r.status,
    r.current_version_number,
    r.created_at,
    r.updated_at,

    u.id AS author_id,
    u.name AS author_name,
    u.email AS author_email,

    p.id AS project_id,
    p.name AS project_name

  FROM reports r

  INNER JOIN users u
    ON u.id = r.user_id

  INNER JOIN projects p
    ON p.id = r.project_id

  WHERE r.status = ?
  
  ORDER BY
    r.week_start_date DESC,
    r.updated_at DESC

  LIMIT ? OFFSET ?
`;

    const [resultForReports] = await pool.execute(queryForReports, [
      status,
      limit,
      offset,
    ]);

    const count = resultForReports.length;

    ok(res, resultForReports, buildMeta({ page, limit, total: count }));
  } catch (error) {
    throw new ApiError(500, "Failed to list team reports");
  }
});

// GET /api/review/reports/:id - manager opens a report for review; reuses
// the same full-detail loader team members get, so both sides see identical
// content (Section 4: "Open any report to review its full contents").
const getTeamReport = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const report = await reportService.getReportById(connection, req.params.id);
    if (!report) {
      throw new ApiError(404, "Report not found");
    }
    ok(res, report);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to get team report");
  } finally {
    connection.release();
  }
});

// POST /api/review/reports/:id/approve
const approveReport = asyncHandler(async (req, res) => {
  try{

  }catch(error){
    throw new ApiError(500, "Failed to approve report");
  }
  const queryForReport = `SELECT * FROM reports WHERE id = ?`;
  const [resultForReport] = await pool.execute(queryForReport, [req.params.id]);
  if (resultForReport.length === 0) {
    throw new ApiError(404, "Report not found");
  }
  const report = resultForReport[0];

  if (report.status !== "submitted") {
    throw new ApiError(
      409,
      `Only a "submitted" report can be approved (current status: ${report.status})`,
    );
  }

  const currentVersion = reportService.getCurrentVersion(report);

  const queryForInsertComment = `
  INSERT INTO review_comments (report_id, report_version_id, reviewer_id, action, comment)
  VALUES (?, ?, ?, ?, ?)
  `;
  await pool.execute(queryForInsertComment, [
    report.id,
    currentVersion.id,
    req.user.id,
    "approved",
    req.body.comment || null,
  ]);

  const queryForUpdateReport = `
  UPDATE reports
  SET status = 'approved'
  WHERE id = ?
  `;
  await pool.execute(queryForUpdateReport, [report.id]);

  ok(res, await reportService.getReportById(report.id));
});

// POST /api/review/reports/:id/request-changes
const requestChanges = asyncHandler(async (req, res) => {
  const queryForReport = `SELECT * FROM reports WHERE id = ?`;
  const [resultForReport] = await pool.execute(queryForReport, [req.params.id]);
  if (resultForReport.length === 0) {
    throw new ApiError(404, "Report not found");
  }
  const report = resultForReport[0];

  if (report.status !== "submitted") {
    throw new ApiError(
      409,
      `Only a "submitted" report can be sent back for changes (current status: ${report.status})`,
    );
  }

  const currentVersion = reportService.getCurrentVersion(report);

  const queryForInsertComment = `
  INSERT INTO review_comments (report_id, report_version_id, reviewer_id, action, comment)
  VALUES (?, ?, ?, ?, ?)
  `;
  await pool.execute(queryForInsertComment, [
    report.id,
    currentVersion.id,
    req.user.id,
    "requested_changes",
    req.body.comment,
  ]);

  const queryForUpdateReport = `
  UPDATE reports
  SET status = 'needs_correction'
  WHERE id = ?
  `;
  await pool.execute(queryForUpdateReport, [report.id]);

  ok(res, await reportService.getReportById(report.id));
});

// GET /api/review/reports/:id/comments - full review history (bonus:
// "keep a short history of previous review comments per report").
// Available to the owner too, since Section 3 requires the team member
// to "see the manager's comment clearly on their report page".
const listComments = asyncHandler(async (req, res) => {
  const queryForReport = `SELECT * FROM reports WHERE id = ?`;
  const [resultForReport] = await pool.execute(queryForReport, [req.params.id]);
  if (resultForReport.length === 0) {
    throw new ApiError(404, "Report not found");
  }
  const report = resultForReport[0];

  const isOwner = report.user_id === req.user.id;
  const isManager = req.user.role === "manager";
  if (!isOwner && !isManager) {
    throw new ApiError(403, "You do not have access to this report");
  }

  const queryForComments = `
  SELECT
    rc.id,
    rc.report_id,
    rc.report_version_id,
    rc.reviewer_id,
    rc.action,
    rc.comment,
    rc.created_at,
    rc.updated_at,

    u.id AS reviewer_id,
    u.name AS reviewer_name,

    rv.id AS version_id,
    rv.version_number

  FROM review_comments rc

  INNER JOIN users u
    ON u.id = rc.reviewer_id

  INNER JOIN report_versions rv
    ON rv.id = rc.report_version_id

  WHERE rc.report_id = ?

  ORDER BY rc.created_at DESC
`;

  const [resultsForComments] = await pool.execute(queryForComments, [
    report.id,
  ]);

  ok(res, resultsForComments);
});

module.exports = {
  listTeamReports,
  getTeamReport,
  approveReport,
  requestChanges,
  listComments,
};
