const express = require('express');
const projectController = require('../controllers/project.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { createProjectRules, updateProjectRules } = require('../validators/project.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', projectController.listProjects);
router.get('/:id', projectController.getProject);
router.post('/', authorize('manager'), createProjectRules, validate, projectController.createProject);
router.patch('/:id', authorize('manager'), updateProjectRules, validate, projectController.updateProject);
router.delete('/:id', authorize('manager'), projectController.deleteProject);
router.post('/:id/assign', authorize('manager'), projectController.assignMember);
router.delete('/:id/assign/:userId', authorize('manager'), projectController.removeMember);

module.exports = router;
