const express = require('express');
const aiController = require('../controllers/ai.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('manager'));

router.get('/status', aiController.status);
router.post('/chat', aiController.chat);

module.exports = router;
