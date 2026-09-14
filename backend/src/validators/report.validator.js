const { body } = require('express-validator');

const createReportRules = [
  body('project_id').isUUID().withMessage('project_id is required'),
  body('week_start_date').isISO8601().withMessage('week_start_date must be a valid date (YYYY-MM-DD)'),
  body('week_end_date').isISO8601().withMessage('week_end_date must be a valid date (YYYY-MM-DD)'),
];

// The report body is intentionally a fixed shape (Section 2: "The report
// structure must be fixed and identical for every user"), so the same
// rules apply on create and on every subsequent edit.
const reportContentRules = [
  body('project_id').optional().isUUID(),
  body('tasks').optional().isArray().withMessage('tasks must be an array'),
  body('tasks.*.task_name').optional().isString().notEmpty(),
  body('tasks.*.priority').optional().isIn(['low', 'medium', 'high']),
  body('tasks.*.status').optional().isIn(['not_started', 'in_progress', 'done', 'completed', 'blocked']),
  body('tasks_planned_next_week').optional({ nullable: true }).isString(),
  body('blockers').optional().isArray(),
  body('blockers.*.description').optional().isString().notEmpty(),
  body('blockers.*.is_key_issue').optional().isBoolean(),
  body('achievements').optional().isArray(),
  body('achievements.*.description').optional().isString().notEmpty(),
  body('achievements.*.is_key_achievement').optional().isBoolean(),
  body('hours_breakdown').optional().isArray(),
  body('hours_breakdown.*.task_type').optional().isIn(['Development', 'Testing', 'Meetings', 'Documentation', 'Other', 'Code Review']),
  body('hours_breakdown.*.hours').optional().isFloat({ min: 0 }),
  body('notes').optional({ nullable: true }).isString(),
  body('links').optional({ nullable: true }).isString(),
];

module.exports = { createReportRules, reportContentRules };
