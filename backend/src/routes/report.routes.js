const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createReportRules, reportContentRules } = require('../validators/report.validator');

const router = express.Router();

// Every route here is scoped to "my own reports" - access control
// against OTHER users' reports is enforced inside the controller
// (loadReportForAccess), not just by route shape.
router.use(authenticate);

router.post('/', createReportRules, reportContentRules, validate, reportController.createReport);
router.get('/', reportController.listMyReports);
router.get('/:id', reportController.getReport);
router.put('/:id', reportContentRules, validate, reportController.updateReport);
router.post('/:id/submit', reportController.submitReport);
router.get('/:id/versions', reportController.listVersions);
router.get('/:id/versions/:versionId', reportController.getVersion);

module.exports = router;
