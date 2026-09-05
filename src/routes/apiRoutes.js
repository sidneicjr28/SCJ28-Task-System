const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/CategoryController');
const projectController = require('../controllers/ProjectController');
const taskController = require('../controllers/TaskController');
const backupController = require('../controllers/BackupController');
const statsController = require('../controllers/StatsController');
const settingsController = require('../controllers/SettingsController');
const backgroundController = require('../controllers/BackgroundController');
const diaryController = require('../controllers/DiaryController');
const githubController = require('../controllers/GitHubController');

// Categories & Projects
router.get('/categories', (req, res) => categoryController.getCategories(req, res));
router.post('/categories', (req, res) => categoryController.createCategory(req, res));
router.put('/categories/:id', (req, res) => categoryController.updateCategory(req, res));
router.delete('/categories/:id', (req, res) => categoryController.deleteCategory(req, res));

router.post('/projects', (req, res) => projectController.createProject(req, res));
router.put('/projects/:id', (req, res) => projectController.updateProject(req, res));
router.delete('/projects/:id', (req, res) => projectController.deleteProject(req, res));

// Tasks & Subtasks
router.get('/tasks', (req, res) => taskController.getTasks(req, res));
router.post('/tasks', (req, res) => taskController.createTask(req, res));
router.put('/tasks/:id', (req, res) => taskController.updateTask(req, res));
router.patch('/tasks/:id/status', (req, res) => taskController.patchStatus(req, res));
router.delete('/tasks/:id', (req, res) => taskController.deleteTask(req, res));
router.patch('/subtasks/:id/toggle', (req, res) => taskController.toggleSubtask(req, res));

// Diaries
router.get('/diaries', (req, res) => diaryController.getDiaries(req, res));
router.get('/diaries/:id', (req, res) => diaryController.getDiaryById(req, res));
router.post('/diaries', (req, res) => diaryController.createDiary(req, res));
router.put('/diaries/:id', (req, res) => diaryController.updateDiary(req, res));
router.delete('/diaries/:id', (req, res) => diaryController.deleteDiary(req, res));
router.post('/diaries/upload-image', (req, res) => diaryController.uploadImage(req, res));

// Stats
router.get('/stats', (req, res) => statsController.getStats(req, res));

// Settings
router.get('/settings', (req, res) => settingsController.getSettings(req, res));
router.put('/settings', (req, res) => settingsController.updateSettings(req, res));

// Background Image
router.get('/background', (req, res) => backgroundController.getBackground(req, res));
router.post('/background', (req, res) => backgroundController.uploadBackground(req, res));
router.delete('/background', (req, res) => backgroundController.deleteBackground(req, res));

// Import & Export
router.get('/export', (req, res) => backupController.exportBackup(req, res));
router.post('/import', (req, res) => backupController.importBackup(req, res));

// GitHub Routes
router.get('/github/auth', (req, res) => githubController.getAuthUrl(req, res));
router.get('/github/callback', (req, res) => githubController.handleCallback(req, res));
router.get('/github/status', (req, res) => githubController.getStatus(req, res));
router.post('/github/disconnect', (req, res) => githubController.disconnect(req, res));
router.post('/github/config', (req, res) => githubController.saveConfig(req, res));
router.get('/github/projects/:projectId/board', (req, res) => githubController.getBoardData(req, res));
router.post('/github/projects/:projectId/issues', (req, res) => githubController.createIssue(req, res));
router.post('/github/projects/:projectId/import-task', (req, res) => githubController.importTask(req, res));

module.exports = router;
