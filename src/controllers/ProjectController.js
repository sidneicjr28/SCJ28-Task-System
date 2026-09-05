const projectRepo = require('../repositories/ProjectRepository');

class ProjectController {
  async createProject(req, res) {
    try {
      const { category_id, name, description, color, github_repo, github_project_id } = req.body;
      if (!category_id || !name) {
        return res.status(400).json({ error: 'category_id and name are required' });
      }

      const newProject = projectRepo.create({ category_id, name, description, color, github_repo, github_project_id });
      res.status(201).json(newProject);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const { category_id, name, description, color, github_repo, github_project_id } = req.body;
      const updated = projectRepo.update(id, { category_id, name, description, color, github_repo, github_project_id });
      if (!updated) return res.status(404).json({ error: 'Project not found' });
      res.json(updated);
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
