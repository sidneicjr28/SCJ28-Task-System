const taskService = require('../services/TaskService');

class TaskController {
  async getTasks(req, res) {
    try {
      const tasks = taskService.getTasks(req.query);
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createTask(req, res) {
    try {
      const { project_id, title } = req.body;
      if (!project_id || !title) {
        return res.status(400).json({ error: 'project_id and title are required' });
      }

      const createdTask = taskService.createTask(req.body);
      res.status(201).json(createdTask);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateTask(req, res) {
    try {
      const { id } = req.params;
      const updatedTask = taskService.updateTask(id, req.body);
      res.json(updatedTask);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async patchStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = taskService.updateTaskStatus(id, status);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      taskService.deleteTask(id);
      res.json({ message: 'Task deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async toggleSubtask(req, res) {
    try {
      const { id } = req.params;
      const result = taskService.toggleSubtask(id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new TaskController();
