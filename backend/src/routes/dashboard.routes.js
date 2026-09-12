const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('manager'));

router.get('/summary', dashboardController.summary);
router.get('/charts/tasks-trend', dashboardController.tasksTrend);
router.get('/charts/status-by-member', dashboardController.statusByMember);
router.get('/charts/workload-by-project', dashboardController.workloadByProject);
router.get('/charts/hours-by-type', dashboardController.hoursByType);
router.get('/activity-feed', dashboardController.activityFeed);

module.exports = router;
