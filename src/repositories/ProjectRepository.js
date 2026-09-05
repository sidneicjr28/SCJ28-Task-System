const db = require('../../database');

class ProjectRepository {
  findAll() {
    return db.prepare('SELECT * FROM projects ORDER BY name ASC').all();
  }

  findByCategory(categoryId) {
    return db.prepare('SELECT * FROM projects WHERE category_id = ? ORDER BY name ASC').all(categoryId);
  }

  findById(id) {
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  }

  create({ category_id, name, description, color, github_repo, github_project_id }) {
    const stmt = db.prepare(`
      INSERT INTO projects (category_id, name, description, color, github_repo, github_project_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(category_id, name, description || '', color || '#ffffff', github_repo || null, github_project_id || null);
    return this.findById(info.lastInsertRowid);
  }

  update(id, fields = {}) {
    const existing = this.findById(id);
    if (!existing) return null;

    const category_id = fields.category_id !== undefined ? fields.category_id : existing.category_id;
    const name = fields.name !== undefined ? fields.name : existing.name;
    const description = fields.description !== undefined ? fields.description : existing.description;
    const color = fields.color !== undefined ? fields.color : existing.color;
    const github_repo = fields.github_repo !== undefined ? (fields.github_repo || null) : existing.github_repo;
    const github_project_id = fields.github_project_id !== undefined ? (fields.github_project_id || null) : existing.github_project_id;

    const stmt = db.prepare(`
      UPDATE projects
      SET category_id = ?,
          name = ?,
          description = ?,
          color = ?,
          github_repo = ?,
          github_project_id = ?
      WHERE id = ?
    `);
    stmt.run(category_id, name, description, color, github_repo, github_project_id, id);
    return this.findById(id);
  }

  delete(id) {
    return db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }
}

module.exports = new ProjectRepository();
