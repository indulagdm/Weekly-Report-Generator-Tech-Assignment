const { body } = require('express-validator');

const inviteUserRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('title').optional().trim().notEmpty(),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['team_member', 'manager']).withMessage('role must be team_member or manager'),
];

const updateUserRules = [
  body('name').optional().trim().notEmpty(),
  body('role').optional().isIn(['team_member', 'manager']),
  body('title').optional().trim().notEmpty(),
  body('is_active').optional().isBoolean(),
];

module.exports = { inviteUserRules, updateUserRules };
