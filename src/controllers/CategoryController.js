const categoryRepo = require('../repositories/CategoryRepository');
const projectRepo = require('../repositories/ProjectRepository');

class CategoryController {
  async getCategories(req, res) {
    try {
      const categories = categoryRepo.findAll();
      const projects = projectRepo.findAll();

      const categoryMap = categories.map(cat => ({
        ...cat,
        projects: projects.filter(p => p.category_id === cat.id)
      }));

      res.json(categoryMap);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createCategory(req, res) {
    try {
      const { name, icon, color } = req.body;
      if (!name) return res.status(400).json({ error: 'Category name is required' });

      const newCat = categoryRepo.create({ name, icon, color });
      res.status(201).json({ ...newCat, projects: [] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, icon, color } = req.body;
      const updated = categoryRepo.update(id, { name, icon, color });
      if (!updated) return res.status(404).json({ error: 'Category not found' });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      categoryRepo.delete(id);
      res.json({ message: 'Category deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new CategoryController();
