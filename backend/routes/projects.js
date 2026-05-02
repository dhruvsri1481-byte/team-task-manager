const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProject,
  addMember,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/', getProjects);

router.post(
  '/',
  [body('name').notEmpty().withMessage('Project name is required')],
  validate,
  createProject
);

router.get('/:id', getProject);
router.delete('/:id', deleteProject);

router.post(
  '/:id/members',
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  addMember
);

module.exports = router;
