const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getDashboardStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/project/:projectId', getTasksByProject);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Task title is required').trim(),
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
    body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid due date'),
  ],
  validate,
  createTask
);

router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty').trim(),
    body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid due date'),
  ],
  validate,
  updateTask
);

router.patch(
  '/:id/status',
  [body('status').isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status')],
  validate,
  updateTaskStatus
);

router.delete('/:id', deleteTask);

module.exports = router;
