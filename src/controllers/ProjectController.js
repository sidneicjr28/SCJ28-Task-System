const projectRepo = require('../repositories/ProjectRepository');

class ProjectController {
  async createProject(req, res) {
    try {
      const { category_id, name, description, color } = req.body;
      if (!category_id || !name) {
        return res.status(400).json({ error: 'category_id and name are required' });
      }

      const newProject = projectRepo.create({ category_id, name, description, color });
      res.status(201).json(newProject);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      projectRepo.delete(id);
      res.json({ message: 'Project deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ProjectController();
