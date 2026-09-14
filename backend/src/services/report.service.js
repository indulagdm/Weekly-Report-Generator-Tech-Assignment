const { ApiError } = require("../utils/apiResponse");
const { pool } = require("../config/database");
const { v4: uuid4 } = require("uuid");

// Replaces the child rows (tasks/blockers/achievements/hours) of a
// single report_version with the payload the client just sent.
//
// Important: a key that is simply ABSENT from the payload means "leave
// this section unchanged" (e.g. a client only re-sending the blockers
// section shouldn't wipe out tasks). A key present with an empty array
// means "the user cleared this section" and legitimately empties it.
// This is why we check `key in payload` rather than defaulting to [].

const writeVersionContent = async (connection, versionId, payload) => {
  const {
    notes,
    links,
    tasks_planned_next_week: tasksPlannedNextWeek,
  } = payload;

  // Update version content
  await connection.execute(
    `
    UPDATE report_versions
    SET
      notes = COALESCE(?, notes),
      links = COALESCE(?, links),
      tasks_planned_next_week = COALESCE(?, tasks_planned_next_week)
    WHERE id = ?
    `,
    [notes ?? null, links ?? null, tasksPlannedNextWeek ?? null, versionId],
  );

  // ----------------------------------------------------------
  // TASKS
  // ----------------------------------------------------------

  if ("tasks" in payload) {
    await connection.execute(
      `
      DELETE FROM tasks
      WHERE report_version_id = ?
      `,
      [versionId],
    );

    if (payload.tasks.length > 0) {
      for (const task of payload.tasks) {
        await connection.execute(
          `
          INSERT INTO tasks (
            id,
            report_version_id,
            task_name,
            priority,
            planned_percent,
            actual_percent,
            status,
            time_planned_hours,
            time_spent_hours,
            output_deliverable
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            uuid4(),
            versionId,
            task.task_name,
            task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "Medium",
            task.planned_percent,
            task.actual_percent,
            task.status === "done" ? "completed" : task.status,
            task.time_planned_hours,
            task.time_spent_hours,
            task.output_deliverable,
          ],
        );
      }
    }
  }

  // ----------------------------------------------------------
  // BLOCKERS
  // ----------------------------------------------------------

  if ("blockers" in payload) {
    await connection.execute(
      `
      DELETE FROM blockers
      WHERE report_version_id = ?
      `,
      [versionId],
    );

    if (payload.blockers.length > 0) {
      for (const blocker of payload.blockers) {
        await connection.execute(
          `
          INSERT INTO blockers (
            id,
            report_version_id,
            description,
            is_key_issue
          )
          VALUES (?, ?, ?, ?)
          `,
          [uuid4(), versionId, blocker.description, blocker.is_key_issue],
        );
      }
    }
  }

  // ----------------------------------------------------------
  // ACHIEVEMENTS
  // ----------------------------------------------------------

  if ("achievements" in payload) {
    await connection.execute(
      `
      DELETE FROM achievements
      WHERE report_version_id = ?
      `,
      [versionId],
    );

    if (payload.achievements.length > 0) {
      for (const achievement of payload.achievements) {
        await connection.execute(
          `
          INSERT INTO achievements (
            id,
            report_version_id,
            description,
            is_key_achievement
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            uuid4(),
            versionId,
            achievement.description,
            achievement.is_key_achievement,
          ],
        );
      }
    }
  }

  // ----------------------------------------------------------
  // HOURS BREAKDOWN
  // ----------------------------------------------------------

  if ("hours_breakdown" in payload) {
    await connection.execute(
      `
      DELETE FROM hours_breakdown
      WHERE report_version_id = ?
      `,
      [versionId],
    );

    if (payload.hours_breakdown.length > 0) {
      for (const hour of payload.hours_breakdown) {
        await connection.execute(
          `
          INSERT INTO hours_breakdown (
            id,
            report_version_id,
            task_type,
            hours
          )
          VALUES (?, ?, ?, ?)
          `,
          [uuid4(), versionId, hour.task_type === "Code Review" ? "Other" : hour.task_type, hour.hours],
        );
      }
    }
  }
};

// Deep-clones a version's content (tasks/blockers/achievements/hours)
// into a brand-new version row. Used to "fork" a fresh, editable
// version off of one that has already been submitted/reviewed, so the
// reviewed version's content is never mutated after the fact.

const cloneVersion = async (connection, sourceVersion, report) => {
  const nextVersionNumber = report.current_version_number + 1;

  const newVersionId = uuid4();

  // Create new version
  await connection.execute(
    `
    INSERT INTO report_versions (
      id,
      report_id,
      version_number,
      tasks_planned_next_week,
      notes,
      links,
      submitted_at
    )
    SELECT
      ?,
      report_id,
      ?,
      tasks_planned_next_week,
      notes,
      links,
      NULL
    FROM report_versions
    WHERE id = ?
    `,
    [newVersionId, nextVersionNumber, sourceVersion.id],
  );

  // Clone tasks
  const [tasks] = await connection.execute(
    `
    SELECT
      task_name,
      priority,
      planned_percent,
      actual_percent,
      status,
      time_planned_hours,
      time_spent_hours,
      output_deliverable
    FROM tasks
    WHERE report_version_id = ?
    `,
    [sourceVersion.id],
  );

  for (const task of tasks) {
    await connection.execute(
      `
      INSERT INTO tasks (
        id,
        report_version_id,
        task_name,
        priority,
        planned_percent,
        actual_percent,
        status,
        time_planned_hours,
        time_spent_hours,
        output_deliverable
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        uuid4(),
        newVersionId,
        task.task_name,
        task.priority,
        task.planned_percent,
        task.actual_percent,
        task.status,
        task.time_planned_hours,
        task.time_spent_hours,
        task.output_deliverable,
      ],
    );
  }

  // Clone blockers
  const [blockers] = await connection.execute(
    `
    SELECT
      description,
      is_key_issue
    FROM blockers
    WHERE report_version_id = ?
    `,
    [sourceVersion.id],
  );

  for (const blocker of blockers) {
    await connection.execute(
      `
      INSERT INTO blockers (
        id,
        report_version_id,
        description,
        is_key_issue
      )
      VALUES (?, ?, ?, ?)
      `,
      [uuid4(), newVersionId, blocker.description, blocker.is_key_issue],
    );
  }

  // Clone achievements
  const [achievements] = await connection.execute(
    `
    SELECT
      description,
      is_key_achievement
    FROM achievements
    WHERE report_version_id = ?
    `,
    [sourceVersion.id],
  );

  for (const achievement of achievements) {
    await connection.execute(
      `
      INSERT INTO achievements (
        id,
        report_version_id,
        description,
        is_key_achievement
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        uuid4(),
        newVersionId,
        achievement.description,
        achievement.is_key_achievement,
      ],
    );
  }

  // Clone hours
  const [hours] = await connection.execute(
    `
    SELECT
      task_type,
      hours
    FROM hours_breakdown
    WHERE report_version_id = ?
    `,
    [sourceVersion.id],
  );

  for (const hour of hours) {
    await connection.execute(
      `
      INSERT INTO hours_breakdown (
        id,
        report_version_id,
        task_type,
        hours
      )
      VALUES (?, ?, ?, ?)
      `,
      [uuid4(), newVersionId, hour.task_type, hour.hours],
    );
  }

  // Update report current version
  await connection.execute(
    `
    UPDATE reports
    SET current_version_number = ?
    WHERE id = ?
    `,
    [nextVersionNumber, report.id],
  );

  return {
    id: newVersionId,
    report_id: report.id,
    version_number: nextVersionNumber,
  };
};

const createReport = async (
  userId,
  { project_id, week_start_date, week_end_date, ...content },
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const reportId = uuid4();

    // Create report
    await connection.execute(
      `
      INSERT INTO reports (
        id,
        user_id,
        project_id,
        week_start_date,
        week_end_date,
        status,
        current_version_number
      )
      VALUES (?, ?, ?, ?, ?, 'draft', 1)
      `,
      [reportId, userId, project_id, week_start_date, week_end_date],
    );

    // Create first version
    const versionId = uuid4();

    await connection.execute(
      `
      INSERT INTO report_versions (
        id,
        report_id,
        version_number
      )
      VALUES (?, ?, 1)
      `,
      [versionId, reportId],
    );

    // Write tasks, blockers, achievements, hours, etc.
    await writeVersionContent(connection, versionId, content);

    await connection.commit();

    return await getReportById(connection, reportId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Returns just the version currently being worked on / reviewed.

const getCurrentVersion = async (connection, reportId) => {
  const [rows] = await connection.execute(
    `
    SELECT rv.*
    FROM report_versions rv
    INNER JOIN reports r
      ON r.id = rv.report_id
    WHERE r.id = ?
      AND rv.version_number = r.current_version_number
    LIMIT 1
    `,
    [reportId],
  );

  return rows[0] || null;
};

// Editing is only allowed while a report is draft or needs_correction
// (Section 2 & 3). Two cases:
//  - The current version was never submitted yet (a plain draft, or a
//    fresh forked version mid-correction that hasn't been resubmitted):
//    edit it in place.
//  - The current version WAS already submitted/reviewed (status is
//    needs_correction and that version carries the manager's comment):
//    fork a brand-new version first so the reviewed version's content
//    stays exactly as the manager saw it (Section 3's version-history
//    requirement), then edit the new version.

const updateReportContent = async (reportId, content) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get report
    const [reports] = await connection.execute(
      `
      SELECT *
      FROM reports
      WHERE id = ?
      LIMIT 1
      `,
      [reportId],
    );

    if (reports.length === 0) {
      throw new ApiError(404, "Report not found");
    }

    const report = reports[0];

    // Check status
    if (!["draft", "needs_correction"].includes(report.status)) {
      throw new ApiError(
        409,
        `Report cannot be edited while status is "${report.status}"`,
      );
    }

    // Update project if supplied
    if (content.project_id) {
      await connection.execute(
        `
        UPDATE reports
        SET project_id = ?
        WHERE id = ?
        `,
        [content.project_id, reportId],
      );
    }

    // Get current version
    const [versions] = await connection.execute(
      `
      SELECT *
      FROM report_versions
      WHERE report_id = ?
        AND version_number = ?
      LIMIT 1
      `,
      [reportId, report.current_version_number],
    );

    if (versions.length === 0) {
      throw new ApiError(404, "Current report version not found");
    }

    let version = versions[0];

    // If already submitted, clone it
    if (version.submitted_at) {
      version = await cloneVersion(connection, version, report);
    }

    // Update content
    await writeVersionContent(connection, version.id, content);

    await connection.commit();

    return await getReportById(connection, reportId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Submitting simply stamps submitted_at on the current version (if not
// already stamped) and flips status to "submitted". All version
// branching already happened at edit-time (see updateReportContent),
// so this stays a simple, idempotent-looking transition.

const submitReport = async (reportId) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get report
    const [reports] = await connection.execute(
      `
      SELECT *
      FROM reports
      WHERE id = ?
      LIMIT 1
      `,
      [reportId],
    );

    if (reports.length === 0) {
      throw new ApiError(404, "Report not found");
    }

    const report = reports[0];

    if (!["draft", "needs_correction"].includes(report.status)) {
      throw new ApiError(
        409,
        `Report cannot be submitted while status is "${report.status}"`,
      );
    }

    // Get current version
    const [versions] = await connection.execute(
      `
      SELECT *
      FROM report_versions
      WHERE report_id = ?
        AND version_number = ?
      LIMIT 1
      `,
      [reportId, report.current_version_number],
    );

    if (versions.length === 0) {
      throw new ApiError(404, "Current report version not found");
    }

    const version = versions[0];

    // Stamp submitted_at if not already submitted
    if (!version.submitted_at) {
      await connection.execute(
        `
        UPDATE report_versions
        SET submitted_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [version.id],
      );
    }

    // Update report status
    await connection.execute(
      `
      UPDATE reports
      SET status = 'submitted'
      WHERE id = ?
      `,
      [reportId],
    );

    await connection.commit();

    return await getReportById(connection, reportId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getReportById = async (connection, reportId) => {
  // Get report
  const [reports] = await connection.execute(
    `
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

    p.name AS project_name,

    rv.id AS report_version_id,
    rv.version_number,
    rv.submitted_at

FROM reports r

INNER JOIN users u
    ON u.id = r.user_id

INNER JOIN projects p
    ON p.id = r.project_id

INNER JOIN report_versions rv
    ON rv.report_id = r.id
    AND rv.version_number = r.current_version_number

WHERE r.id = ?

LIMIT 1;
    `,
    [reportId],
  );

  if (reports.length === 0) {
    return null;
  }

  const report = reports[0];

  // Get versions
  const [versions] = await connection.execute(
    `
    SELECT *
    FROM report_versions
    WHERE report_id = ?
    ORDER BY version_number ASC
    `,
    [reportId],
  );

  // Get tasks
  const [tasks] = await connection.execute(
    `
    SELECT *
    FROM tasks
    WHERE report_version_id IN (
      SELECT id
      FROM report_versions
      WHERE report_id = ?
    )
    `,
    [reportId],
  );

  // Get blockers
  const [blockers] = await connection.execute(
    `
    SELECT *
    FROM blockers
    WHERE report_version_id IN (
      SELECT id
      FROM report_versions
      WHERE report_id = ?
    )
    `,
    [reportId],
  );

  // Get achievements
  const [achievements] = await connection.execute(
    `
    SELECT *
    FROM achievements
    WHERE report_version_id IN (
      SELECT id
      FROM report_versions
      WHERE report_id = ?
    )
    `,
    [reportId],
  );

  // Get hours
  const [hours] = await connection.execute(
    `
    SELECT *
    FROM hours_breakdown
    WHERE report_version_id IN (
      SELECT id
      FROM report_versions
      WHERE report_id = ?
    )
    `,
    [reportId],
  );

  // Attach children to versions
  const formattedVersions = versions.map((version) => ({
    ...version,

    tasks: tasks.filter((task) => task.report_version_id === version.id),

    blockers: blockers.filter(
      (blocker) => blocker.report_version_id === version.id,
    ),

    achievements: achievements.filter(
      (achievement) => achievement.report_version_id === version.id,
    ),

    hours_breakdown: hours.filter(
      (hour) => hour.report_version_id === version.id,
    ),
  }));

  return {
    id: report.id,
    user_id: report.user_id,
    project_id: report.project_id,
    week_start_date: report.week_start_date,
    week_end_date: report.week_end_date,
    status: report.status,
    current_version_number: report.current_version_number,
    submitted_at: report.submitted_at,
    created_at: report.created_at,
    updated_at: report.updated_at,
    submitted_at: formattedVersions.find(
      (v) => v.version_number === report.current_version_number,
    )?.submitted_at,

    author: {
      id: report.author_id,
      name: report.author_name,
      email: report.author_email,
    },

    project: {
      id: report.project_id,
      name: report.project_name,
    },

    versions: formattedVersions,
  };
};

module.exports = {
  createReport,
  getReportById,
  getCurrentVersion,
  updateReportContent,
  submitReport,
};
