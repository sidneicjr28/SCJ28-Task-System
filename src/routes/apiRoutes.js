const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/CategoryController');
const projectController = require('../controllers/ProjectController');
const taskController = require('../controllers/TaskController');
const backupController = require('../controllers/BackupController');
const statsController = require('../controllers/StatsController');

// Categories & Projects
router.get('/categories', (req, res) => categoryController.getCategories(req, res));
router.post('/categories', (req, res) => categoryController.createCategory(req, res));
router.post('/projects', (req, res) => projectController.createProject(req, res));
router.delete('/projects/:id', (req, res) => projectController.deleteProject(req, res));

// Tasks & Subtasks
router.get('/tasks', (req, res) => taskController.getTasks(req, res));
router.post('/tasks', (req, res) => taskController.createTask(req, res));
router.put('/tasks/:id', (req, res) => taskController.updateTask(req, res));
router.patch('/tasks/:id/status', (req, res) => taskController.patchStatus(req, res));
router.delete('/tasks/:id', (req, res) => taskController.deleteTask(req, res));
router.patch('/subtasks/:id/toggle', (req, res) => taskController.toggleSubtask(req, res));

// Stats
router.get('/stats', (req, res) => statsController.getStats(req, res));

// Import & Export
router.get('/export', (req, res) => backupController.exportBackup(req, res));
router.post('/import', (req, res) => backupController.importBackup(req, res));

module.exports = router;
