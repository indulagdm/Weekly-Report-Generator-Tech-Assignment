const express = require('express');
const reviewController = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { requestChangesRules, approveRules } = require('../validators/review.validator');

const router = express.Router();

router.use(authenticate);

// Comments are visible to the report owner too (see controller), so this
// one route is intentionally not manager-only.
router.get('/reports/:id/comments', reviewController.listComments);

// Everything else on the review/dashboard surface is manager-only.
router.use(authorize('manager'));

router.get('/reports', reviewController.listTeamReports);
router.get('/reports/:id', reviewController.getTeamReport);
router.post('/reports/:id/approve', approveRules, validate, reviewController.approveReport);
router.post('/reports/:id/request-changes', requestChangesRules, validate, reviewController.requestChanges);

module.exports = router;
