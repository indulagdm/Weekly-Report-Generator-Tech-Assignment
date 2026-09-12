const { ok } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { pool } = require("../config/database");

// All dashboard queries pull a modestly-sized, already-filtered slice of
// rows and aggregate in JS rather than hand-rolling cross-dialect SQL
// GROUP BYs - simpler to read/maintain at this data scale, and works
// identically against MySQL (prod) and SQLite (tests).

const weekRangeFromQuery = (query) => {
  // Defaults to the current week (Mon-Sun) if no week is supplied.
  if (query.week_start_date) return query.week_start_date;
  const now = new Date();
  const day = (now.getUTCDay() + 6) % 7; // 0 = Monday
  now.setUTCDate(now.getUTCDate() - day);
  return now.toISOString().slice(0, 10);
};

// GET /api/dashboard/summary?week_start_date=YYYY-MM-DD
const summary = asyncHandler(async (req, res) => {
  try {
    const week = weekRangeFromQuery(req.query);

    // Total active team members
    const [membersResult] = await pool.execute(
      `
    SELECT COUNT(*) AS total
    FROM users
    WHERE role = 'team_member'
      AND is_active = TRUE
    `,
    );

    const totalActiveMembers = Number(membersResult[0].total);

    // Reports for this week
    const [reportsResult] = await pool.execute(
      `
    SELECT id, user_id, status, current_version_number
    FROM reports
    WHERE week_start_date = ?
    `,
      [week],
    );

    const reportsThisWeek = reportsResult;

    // Number of submitted/needs_correction/approved reports
    const [submittedResult] = await pool.execute(
      `
    SELECT COUNT(*) AS total
    FROM reports
    WHERE week_start_date = ?
      AND status IN ('submitted', 'needs_correction', 'approved')
    `,
      [week],
    );

    const submitted = Number(submittedResult[0].total);

    // Number of reports needing correction
    const [correctionResult] = await pool.execute(
      `
    SELECT COUNT(*) AS total
    FROM reports
    WHERE week_start_date = ?
      AND status = 'needs_correction'
    `,
      [week],
    );

    const needsCorrectionCount = Number(correctionResult[0].total);

    // Draft reports
    const [draftResult] = await pool.execute(
      `
    SELECT COUNT(*) AS total
    FROM reports
    WHERE week_start_date = ?
      AND status = 'draft'
    `,
      [week],
    );

    const draftOnly = Number(draftResult[0].total);

    const notStarted = Math.max(0, totalActiveMembers - reportsThisWeek.length);

    const pending = draftOnly + notStarted;

    // Get open report IDs
    const openReportIds = reportsThisWeek
      .filter((report) => report.status !== "approved")
      .map((report) => report.id);

    let openBlockers = 0;

    if (openReportIds.length > 0) {
      const placeholders = openReportIds.map(() => "?").join(",");

      const [blockerResult] = await pool.execute(
        `
      SELECT COUNT(*) AS total
      FROM blockers b
      INNER JOIN report_versions rv
        ON rv.id = b.report_version_id
      WHERE rv.report_id IN (${placeholders})
        AND rv.version_number = (
          SELECT r.current_version_number
          FROM reports r
          WHERE r.id = rv.report_id
        )
      `,
        openReportIds,
      );

      openBlockers = Number(blockerResult[0].total);
    }

    ok(res, {
      week_start_date: week,
      total_reports_submitted: submitted,
      total_active_team_members: totalActiveMembers,

      submission_compliance_rate: totalActiveMembers
        ? Number(((submitted / totalActiveMembers) * 100).toFixed(1))
        : 0,

      pending_count: pending,
      needs_correction_count: needsCorrectionCount,
      open_blockers_count: openBlockers,
    });
  } catch (error) {
    throw new ApiError(500, "Failed to get dashboard summary");
  }
});

// GET /api/dashboard/charts/tasks-trend?user_id=&weeks=8

const tasksTrend = asyncHandler(async (req, res) => {
  try {
    const weeksBack = parseInt(req.query.weeks, 10) || 8;

    let query = `
    SELECT
      r.week_start_date,
      COUNT(t.id) AS tasks_total,
      SUM(
        CASE
          WHEN t.status = 'completed' THEN 1
          ELSE 0
        END
      ) AS tasks_completed
    FROM reports r

    INNER JOIN report_versions rv
      ON rv.report_id = r.id
      AND rv.version_number = r.current_version_number

    LEFT JOIN tasks t
      ON t.report_version_id = rv.id
  `;

    const params = [];

    if (req.query.user_id) {
      query += `
      WHERE r.user_id = ?
    `;

      params.push(req.query.user_id);
    }

    query += `
    GROUP BY r.week_start_date
    ORDER BY r.week_start_date DESC
    LIMIT ?
  `;

    params.push(weeksBack);

    const [result] = await pool.execute(query, params);

    const series = result.reverse().map((row) => ({
      week_start_date: row.week_start_date,
      tasks_completed: Number(row.tasks_completed || 0),
      tasks_total: Number(row.tasks_total || 0),
    }));

    ok(res, series);
  } catch (error) {
    throw new ApiError(500, "Failed to get tasks trend");
  }
});

// GET /api/dashboard/charts/status-by-member?week_start_date=

const statusByMember = asyncHandler(async (req, res) => {
  try {
    const week = weekRangeFromQuery(req.query);

    const query = `
    SELECT
      u.id AS user_id,
      u.name,

      COALESCE(r.status, 'not_started') AS status

    FROM users u

    LEFT JOIN reports r
      ON r.user_id = u.id
      AND r.week_start_date = ?

    WHERE u.role = 'team_member'
      AND u.is_active = TRUE

    ORDER BY u.name ASC
  `;

    const [result] = await pool.execute(query, [week]);

    const data = result.map((row) => ({
      user_id: row.user_id,
      name: row.name,
      status: row.status,
    }));

    ok(res, data);
  } catch (error) {
    throw new ApiError(500, "Failed to get status by member");
  }
});

// GET /api/dashboard/charts/workload-by-project?from=&to=

const workloadByProject = asyncHandler(async (req, res) => {
  try {
    let query = `
    SELECT
      COALESCE(p.name, 'Unassigned') AS project,
      COUNT(t.id) AS task_count

    FROM reports r

    LEFT JOIN projects p
      ON p.id = r.project_id

    INNER JOIN report_versions rv
      ON rv.report_id = r.id
      AND rv.version_number = r.current_version_number

    LEFT JOIN tasks t
      ON t.report_version_id = rv.id
  `;

    const params = [];
    const conditions = [];

    if (req.query.from) {
      conditions.push("r.week_start_date >= ?");
      params.push(req.query.from);
    }

    if (req.query.to) {
      conditions.push("r.week_start_date <= ?");
      params.push(req.query.to);
    }

    if (conditions.length > 0) {
      query += `
      WHERE ${conditions.join(" AND ")}
    `;
    }

    query += `
    GROUP BY p.id, p.name
    ORDER BY task_count DESC
  `;

    const [result] = await pool.execute(query, params);

    const data = result.map((row) => ({
      project: row.project,
      task_count: Number(row.task_count),
    }));

    ok(res, data);
  } catch (error) {
    throw new ApiError(500, "Failed to get workload by project");
  }
});

// GET /api/dashboard/charts/hours-by-type?week_start_date=

const hoursByType = asyncHandler(async (req, res) => {
  try {
    const week = weekRangeFromQuery(req.query);

    const query = `
    SELECT
      hb.task_type,
      SUM(hb.hours) AS hours

    FROM reports r

    INNER JOIN report_versions rv
      ON rv.report_id = r.id
      AND rv.version_number = r.current_version_number

    INNER JOIN hours_breakdown hb
      ON hb.report_version_id = rv.id

    WHERE r.week_start_date = ?

    GROUP BY hb.task_type

    ORDER BY hb.task_type ASC
  `;

    const [result] = await pool.execute(query, [week]);

    const data = result.map((row) => ({
      task_type: row.task_type,
      hours: Number(row.hours),
    }));

    ok(res, data);
  } catch (error) {
    throw new Error("Failed to get hours by type");
  }
});

// GET /api/dashboard/activity-feed?limit=20

const activityFeed = asyncHandler(async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const [recentReports] = await pool.execute(
      `
    SELECT
      r.id AS report_id,
      u.name AS member,
      r.status,
      r.updated_at AS at

    FROM reports r

    INNER JOIN users u
      ON u.id = r.user_id

    ORDER BY r.updated_at DESC

    LIMIT ?
    `,
      [limit],
    );

    const [recentReviews] = await pool.execute(
      `
    SELECT
      rc.report_id,
      author.name AS member,
      reviewer.name AS reviewer,
      rc.action,
      rc.comment,
      rc.created_at AS at

    FROM review_comments rc

    INNER JOIN users reviewer
      ON reviewer.id = rc.reviewer_id

    INNER JOIN reports r
      ON r.id = rc.report_id

    INNER JOIN users author
      ON author.id = r.user_id

    ORDER BY rc.created_at DESC

    LIMIT ?
    `,
      [limit],
    );

    const feed = [
      ...recentReports.map((r) => ({
        type: "report_update",
        report_id: r.report_id,
        member: r.member,
        status: r.status,
        at: r.at,
      })),

      ...recentReviews.map((c) => ({
        type: "review_action",
        report_id: c.report_id,
        member: c.member,
        reviewer: c.reviewer,
        action: c.action,
        comment: c.comment,
        at: c.at,
      })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, limit);

    ok(res, feed);
  } catch (error) {
    throw new ApiError(500, "Failed to get activity feed");
  }
});

module.exports = {
  summary,
  tasksTrend,
  statusByMember,
  workloadByProject,
  hoursByType,
  activityFeed,
};
