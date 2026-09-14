
require("dotenv").config();

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const { pool } = require("../config/database");


// ============================================================
// HELPERS
// ============================================================

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function mondayWeeksAgo(weeksAgo) {
  const now = new Date();

  const day = (now.getUTCDay() + 6) % 7;

  now.setUTCDate(
    now.getUTCDate() - day - weeksAgo * 7
  );

  now.setUTCHours(0, 0, 0, 0);

  return now;
}


// ============================================================
// SAMPLE REPORT CONTENT
// ============================================================

function sampleContent(seedIndex, weekIndex) {
  return {
    tasks: [
      {
        task_name:
          `Implement feature ${seedIndex}.${weekIndex}.1`,

        priority: "High",

        planned_percent: 100,

        actual_percent:
          weekIndex === 1 ? 60 : 100,

        status:
          weekIndex === 1
            ? "in_progress"
            : "completed",

        time_planned_hours: 12,

        time_spent_hours:
          weekIndex === 1 ? 8 : 13,

        output_deliverable:
          "PR merged to main",
      },

      {
        task_name:
          `Fix bug report ${seedIndex}.${weekIndex}.2`,

        priority: "Medium",

        planned_percent: 100,

        actual_percent: 100,

        status: "completed",

        time_planned_hours: 4,

        time_spent_hours: 3.5,

        output_deliverable:
          "Bug closed, regression test added",
      },

      {
        task_name:
          `Write unit tests ${seedIndex}.${weekIndex}.3`,

        priority: "Low",

        planned_percent: 100,

        actual_percent: 40,

        status: "in_progress",

        time_planned_hours: 6,

        time_spent_hours: 2,

        output_deliverable:
          "Unit test implementation in progress",
      },
    ],

    tasks_planned_next_week:
      "Continue feature work; start code review backlog; pair on onboarding docs.",

    blockers: [
      {
        description:
          "Waiting on API credentials from the platform team",

        is_key_issue: true,
      },

      {
        description:
          "Flaky CI pipeline slowed down testing",

        is_key_issue: false,
      },
    ],

    achievements: [
      {
        description:
          "Shipped the new dashboard widget ahead of schedule",

        is_key_achievement: true,
      },

      {
        description:
          "Mentored a teammate through their first PR",

        is_key_achievement: false,
      },
    ],

    hours_breakdown: [
      {
        task_type: "Development",
        hours: 12,
      },

      {
        task_type: "Testing",
        hours: 4,
      },

      {
        task_type: "Meetings",
        hours: 3,
      },

      {
        task_type: "Documentation",
        hours: 3,
      },
    ],

    notes:
      "Solid week overall.",

    links:
      "https://github.com/example/repo/pull/123",
  };
}


// ============================================================
// INSERT REPORT VERSION
// ============================================================

async function createReportVersion(
  connection,
  reportId,
  versionNumber,
  content
) {
  const versionId = randomUUID();

  await connection.execute(
    `
      INSERT INTO report_versions
      (
        id,
        report_id,
        version_number,
        tasks_planned_next_week,
        notes,
        links
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      versionId,
      reportId,
      versionNumber,
      content.tasks_planned_next_week,
      content.notes,
      content.links,
    ]
  );

  return versionId;
}


// ============================================================
// INSERT TASKS
// ============================================================

async function insertTasks(
  connection,
  reportVersionId,
  tasks
) {
  for (const task of tasks) {
    await connection.execute(
      `
        INSERT INTO tasks
        (
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
        randomUUID(),

        reportVersionId,

        task.task_name,

        task.priority,

        task.planned_percent,

        task.actual_percent,

        task.status,

        task.time_planned_hours,

        task.time_spent_hours,

        task.output_deliverable,
      ]
    );
  }
}


// ============================================================
// INSERT BLOCKERS
// ============================================================

async function insertBlockers(
  connection,
  reportVersionId,
  blockers
) {
  for (const blocker of blockers) {
    await connection.execute(
      `
        INSERT INTO blockers
        (
          id,
          report_version_id,
          description,
          is_key_issue
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        randomUUID(),

        reportVersionId,

        blocker.description,

        blocker.is_key_issue ? 1 : 0,
      ]
    );
  }
}


// ============================================================
// INSERT ACHIEVEMENTS
// ============================================================

async function insertAchievements(
  connection,
  reportVersionId,
  achievements
) {
  for (const achievement of achievements) {
    await connection.execute(
      `
        INSERT INTO achievements
        (
          id,
          report_version_id,
          description,
          is_key_achievement
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        randomUUID(),

        reportVersionId,

        achievement.description,

        achievement.is_key_achievement ? 1 : 0,
      ]
    );
  }
}


// ============================================================
// INSERT HOURS
// ============================================================

async function insertHours(
  connection,
  reportVersionId,
  hours
) {
  for (const item of hours) {
    await connection.execute(
      `
        INSERT INTO hours_breakdown
        (
          id,
          report_version_id,
          task_type,
          hours
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        randomUUID(),

        reportVersionId,

        item.task_type,

        item.hours,
      ]
    );
  }
}


// ============================================================
// CREATE COMPLETE REPORT
// ============================================================

async function createReport(
  connection,
  userId,
  projectId,
  weekStart,
  weekEnd,
  content
) {
  const reportId = randomUUID();

  // ----------------------------------------------------------
  // REPORT
  // ----------------------------------------------------------

  await connection.execute(
    `
      INSERT INTO reports
      (
        id,
        user_id,
        project_id,
        week_start_date,
        week_end_date,
        status,
        current_version_number
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      reportId,

      userId,

      projectId,

      weekStart,

      weekEnd,

      "draft",

      1,
    ]
  );


  // ----------------------------------------------------------
  // VERSION 1
  // ----------------------------------------------------------

  const versionId =
    await createReportVersion(
      connection,
      reportId,
      1,
      content
    );


  // ----------------------------------------------------------
  // TASKS
  // ----------------------------------------------------------

  await insertTasks(
    connection,
    versionId,
    content.tasks
  );


  // ----------------------------------------------------------
  // BLOCKERS
  // ----------------------------------------------------------

  await insertBlockers(
    connection,
    versionId,
    content.blockers
  );


  // ----------------------------------------------------------
  // ACHIEVEMENTS
  // ----------------------------------------------------------

  await insertAchievements(
    connection,
    versionId,
    content.achievements
  );


  // ----------------------------------------------------------
  // HOURS
  // ----------------------------------------------------------

  await insertHours(
    connection,
    versionId,
    content.hours_breakdown
  );


  return {
    reportId,
    versionId,
  };
}


// ============================================================
// GET CURRENT VERSION
// ============================================================

async function getCurrentVersion(
  connection,
  reportId
) {
  const [rows] =
    await connection.execute(
      `
        SELECT
          id,
          report_id,
          version_number,
          tasks_planned_next_week,
          notes,
          links,
          submitted_at
        FROM report_versions
        WHERE report_id = ?
        ORDER BY version_number DESC
        LIMIT 1
      `,
      [reportId]
    );

  return rows[0] || null;
}


// ============================================================
// SUBMIT REPORT
// ============================================================

async function submitReport(
  connection,
  reportId
) {
  await connection.execute(
    `
      UPDATE reports
      SET status = 'submitted'
      WHERE id = ?
    `,
    [reportId]
  );
}


// ============================================================
// ADD REVIEW COMMENT
// ============================================================

async function addReviewComment(
  connection,
  reportId,
  reportVersionId,
  reviewerId,
  action,
  comment
) {
  await connection.execute(
    `
      INSERT INTO review_comments
      (
        id,
        report_id,
        report_version_id,
        reviewer_id,
        action,
        comment
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      randomUUID(),

      reportId,

      reportVersionId,

      reviewerId,

      action,

      comment,
    ]
  );
}


// ============================================================
// CREATE VERSION 2
// ============================================================

async function createUpdatedVersion(
  connection,
  reportId,
  content
) {
  const currentVersion =
    await getCurrentVersion(
      connection,
      reportId
    );

  const nextVersion =
    currentVersion.version_number + 1;


  // ----------------------------------------------------------
  // VERSION
  // ----------------------------------------------------------

  const versionId =
    await createReportVersion(
      connection,
      reportId,
      nextVersion,
      content
    );


  // ----------------------------------------------------------
  // CONTENT
  // ----------------------------------------------------------

  await insertTasks(
    connection,
    versionId,
    content.tasks
  );

  await insertBlockers(
    connection,
    versionId,
    content.blockers
  );

  await insertAchievements(
    connection,
    versionId,
    content.achievements
  );

  await insertHours(
    connection,
    versionId,
    content.hours_breakdown
  );


  // ----------------------------------------------------------
  // UPDATE CURRENT VERSION
  // ----------------------------------------------------------

  await connection.execute(
    `
      UPDATE reports
      SET
        current_version_number = ?,
        status = 'draft'
      WHERE id = ?
    `,
    [
      nextVersion,
      reportId,
    ]
  );


  return versionId;
}


// ============================================================
// SEED
// ============================================================

async function seed() {
  const connection =
    await pool.getConnection();

  try {
    console.log("====================================");
    console.log("Starting database seed...");
    console.log("====================================");


    // ========================================================
    // TRANSACTION
    // ========================================================

    await connection.beginTransaction();


    // ========================================================
    // DISABLE FOREIGN KEYS
    // ========================================================

    await connection.execute(
      `SET FOREIGN_KEY_CHECKS = 0`
    );


    // ========================================================
    // CLEAR TABLES
    // ========================================================

    await connection.execute(
      `TRUNCATE TABLE review_comments`
    );

    await connection.execute(
      `TRUNCATE TABLE hours_breakdown`
    );

    await connection.execute(
      `TRUNCATE TABLE achievements`
    );

    await connection.execute(
      `TRUNCATE TABLE blockers`
    );

    await connection.execute(
      `TRUNCATE TABLE tasks`
    );

    await connection.execute(
      `TRUNCATE TABLE report_versions`
    );

    await connection.execute(
      `TRUNCATE TABLE reports`
    );

    await connection.execute(
      `TRUNCATE TABLE user_projects`
    );

    await connection.execute(
      `TRUNCATE TABLE projects`
    );

    await connection.execute(
      `TRUNCATE TABLE users`
    );


    // ========================================================
    // ENABLE FOREIGN KEYS
    // ========================================================

    await connection.execute(
      `SET FOREIGN_KEY_CHECKS = 1`
    );


    // ========================================================
    // PASSWORD
    // ========================================================

    const passwordHash =
      await bcrypt.hash(
        "Password123!",
        12
      );


    // ========================================================
    // MANAGER
    // ========================================================

    const managerId =
      randomUUID();

    await connection.execute(
      `
        INSERT INTO users
        (
          id,
          name,
          email,
          role,
          title,
          password,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        managerId,

        "Priya Sharma",

        "manager@example.com",

        "manager",

        "Engineering Manager",

        passwordHash,

        1,
      ]
    );


    // ========================================================
    // MEMBERS
    // ========================================================

    const memberDefinitions = [
      {
        name: "Alex Chen",
        email: "alex@example.com",
        title: "Software Engineer",
      },

      {
        name: "Jordan Lee",
        email: "jordan@example.com",
        title: "Associate Software Engineer",
      },

      {
        name: "Sam Patel",
        email: "sam@example.com",
        title: "Software Engineer",
      },

      {
        name: "Morgan Diaz",
        email: "morgan@example.com",
        title: "Junior Software Engineer",
      },

      {
        name: "Taylor Nguyen",
        email: "taylor@example.com",
        title: "Software Engineer Intern",
      },
    ];


    const members = [];


    for (
      const member of memberDefinitions
    ) {
      const memberId =
        randomUUID();


      await connection.execute(
        `
          INSERT INTO users
          (
            id,
            name,
            email,
            role,
            title,
            password,
            is_active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          memberId,

          member.name,

          member.email,

          "team_member",

          member.title,

          passwordHash,

          1,
        ]
      );


      members.push({
        id: memberId,

        name: member.name,

        email: member.email,
      });
    }


    // ========================================================
    // PROJECTS
    // ========================================================

    const projectDefinitions = [
      {
        name: "Client A",
        description:
          "External client engagement",
      },

      {
        name: "Internal Tooling",
        description:
          "Internal developer tooling",
      },

      {
        name: "R&D",
        description:
          "Research and prototyping",
      },

      {
        name: "Marketing Site",
        description:
          "Public marketing website",
      },
    ];


    const projects = [];


    for (
      const project of projectDefinitions
    ) {
      const projectId =
        randomUUID();


      await connection.execute(
        `
          INSERT INTO projects
          (
            id,
            name,
            description,
            is_active
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          projectId,

          project.name,

          project.description,

          1,
        ]
      );


      projects.push({
        id: projectId,

        name: project.name,
      });
    }


    // ========================================================
    // USER PROJECT ASSIGNMENTS
    // ========================================================

    for (
      let i = 0;
      i < members.length;
      i++
    ) {
      const firstProject =
        projects[
          i % projects.length
        ];

      const secondProject =
        projects[
          (i + 1) %
            projects.length
        ];


      await connection.execute(
        `
          INSERT INTO user_projects
          (
            id,
            user_id,
            project_id
          )
          VALUES (?, ?, ?)
        `,
        [
          randomUUID(),

          members[i].id,

          firstProject.id,
        ]
      );


      await connection.execute(
        `
          INSERT INTO user_projects
          (
            id,
            user_id,
            project_id
          )
          VALUES (?, ?, ?)
        `,
        [
          randomUUID(),

          members[i].id,

          secondProject.id,
        ]
      );
    }


    // ========================================================
    // REPORTS
    // ========================================================

    for (
      let memberIndex = 0;
      memberIndex < members.length;
      memberIndex++
    ) {
      const member =
        members[memberIndex];


      const project =
        projects[
          memberIndex %
            projects.length
        ];


      // ------------------------------------------------------
      // 4 WEEKS
      // ------------------------------------------------------

      for (
        let weekIndex = 3;
        weekIndex >= 0;
        weekIndex--
      ) {
        const start =
          mondayWeeksAgo(
            weekIndex
          );


        const end =
          new Date(start);


        end.setUTCDate(
          end.getUTCDate() + 6
        );


        const content =
          sampleContent(
            memberIndex + 1,
            weekIndex
          );


        // ----------------------------------------------------
        // CREATE REPORT
        // ----------------------------------------------------

        const report =
          await createReport(
            connection,

            member.id,

            project.id,

            isoDate(start),

            isoDate(end),

            content
          );


        const reportId =
          report.reportId;


        // ----------------------------------------------------
        // STATUS SCENARIO
        // ----------------------------------------------------

        const scenario =
          (
            memberIndex +
            weekIndex
          ) % 4;


        // ----------------------------------------------------
        // CURRENT WEEK
        // ----------------------------------------------------

        if (
          weekIndex === 0
        ) {

          // Taylor has not started
          if (
            memberIndex === 4
          ) {
            continue;
          }


          // Morgan remains draft
          if (
            memberIndex === 3
          ) {
            continue;
          }
        }


        // ====================================================
        // SCENARIO 0
        // SUBMITTED
        // ====================================================

        if (
          scenario === 0
        ) {
          await submitReport(
            connection,
            reportId
          );

          continue;
        }


        // ====================================================
        // SCENARIO 1
        // NEEDS CORRECTION
        // ====================================================

        if (
          scenario === 1
        ) {
          await submitReport(
            connection,
            reportId
          );


          const version =
            await getCurrentVersion(
              connection,
              reportId
            );


          await addReviewComment(
            connection,

            reportId,

            version.id,

            managerId,

            "request_changes",

            "Please add more detail to the blockers section and confirm the planned vs actual hours for task 1."
          );


          await connection.execute(
            `
              UPDATE reports
              SET status = 'needs_correction'
              WHERE id = ?
            `,
            [reportId]
          );


          continue;
        }


        // ====================================================
        // SCENARIO 2
        // CORRECTION -> RESUBMIT -> APPROVE
        // ====================================================

        if (
          scenario === 2
        ) {
          await submitReport(
            connection,
            reportId
          );


          const version1 =
            await getCurrentVersion(
              connection,
              reportId
            );


          await addReviewComment(
            connection,

            reportId,

            version1.id,

            managerId,

            "request_changes",

            "Task 3 looks under-scoped for the time spent - please clarify the output/deliverable."
          );


          await connection.execute(
            `
              UPDATE reports
              SET status = 'needs_correction'
              WHERE id = ?
            `,
            [reportId]
          );


          // --------------------------------------------------
          // UPDATED CONTENT
          // --------------------------------------------------

          const updatedContent =
            sampleContent(
              memberIndex + 1,
              weekIndex
            );


          updatedContent.notes =
            "Updated after manager feedback: clarified deliverable for task 3.";


          // --------------------------------------------------
          // VERSION 2
          // --------------------------------------------------

          const version2Id =
            await createUpdatedVersion(
              connection,

              reportId,

              updatedContent
            );


          // --------------------------------------------------
          // RESUBMIT
          // --------------------------------------------------

          await submitReport(
            connection,
            reportId
          );


          // --------------------------------------------------
          // APPROVAL
          // --------------------------------------------------

          await addReviewComment(
            connection,

            reportId,

            version2Id,

            managerId,

            "approve",

            "Looks good now, thanks for the clarification."
          );


          await connection.execute(
            `
              UPDATE reports
              SET status = 'approved'
              WHERE id = ?
            `,
            [reportId]
          );


          continue;
        }


        // ====================================================
        // SCENARIO 3
        // DIRECT APPROVAL
        // ====================================================

        await submitReport(
          connection,
          reportId
        );


        const version =
          await getCurrentVersion(
            connection,
            reportId
          );


        await addReviewComment(
          connection,

          reportId,

          version.id,

          managerId,

          "approve",

          "Great progress this week."
        );


        await connection.execute(
          `
            UPDATE reports
            SET status = 'approved'
            WHERE id = ?
          `,
          [reportId]
        );
      }
    }


    // ========================================================
    // COMMIT
    // ========================================================

    await connection.commit();


    // ========================================================
    // SUCCESS
    // ========================================================

    console.log("");
    console.log("====================================");
    console.log("Seed complete!");
    console.log("====================================");
    console.log("");
    console.log(
      "Manager:"
    );
    console.log(
      "  Email: manager@example.com"
    );
    console.log(
      "  Password: Password123!"
    );
    console.log("");
    console.log(
      "Members:"
    );
    console.log(
      "  alex@example.com"
    );
    console.log(
      "  jordan@example.com"
    );
    console.log(
      "  sam@example.com"
    );
    console.log(
      "  morgan@example.com"
    );
    console.log(
      "  taylor@example.com"
    );
    console.log(
      "  Password: Password123!"
    );
    console.log("");
  } catch (error) {

    await connection.rollback();

    console.error("");
    console.error(
      "===================================="
    );
    console.error(
      "Seed failed!"
    );
    console.error(
      "===================================="
    );
    console.error(error);

    process.exitCode = 1;
  } finally {

    connection.release();

    await pool.end();
  }
}


// ============================================================
// RUN
// ============================================================

seed();