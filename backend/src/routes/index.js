const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/projects', require('./project.routes'));
router.use('/reports', require('./report.routes'));
router.use('/review', require('./review.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/ai', require('./ai.routes'));

router.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

module.exports = router;
