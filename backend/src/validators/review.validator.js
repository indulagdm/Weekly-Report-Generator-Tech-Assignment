const { body } = require('express-validator');

const requestChangesRules = [
  body('comment').trim().notEmpty().withMessage('A comment explaining what needs correction is required'),
];

const approveRules = [
  body('comment').optional({ nullable: true }).isString(),
];

module.exports = { requestChangesRules, approveRules };
