const { body } = require('express-validator');

const createProjectRules = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 120 }),
  body('description').optional({ nullable: true }).isString(),
];

const updateProjectRules = [
  body('name').optional().trim().notEmpty().isLength({ max: 120 }),
  body('description').optional({ nullable: true }).isString(),
  body('is_active').optional().isBoolean(),
];

module.exports = { createProjectRules, updateProjectRules };
