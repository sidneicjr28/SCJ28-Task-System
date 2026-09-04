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

  create({ category_id, name, description, color }) {
    const stmt = db.prepare(`
      INSERT INTO projects (category_id, name, description, color)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(category_id, name, description || '', color || '#ffffff');
    return this.findById(info.lastInsertRowid);
  }

  update(id, { category_id, name, description, color }) {
    const stmt = db.prepare(`
      UPDATE projects
      SET category_id = COALESCE(?, category_id),
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          color = COALESCE(?, color)
      WHERE id = ?
    `);
    stmt.run(category_id, name, description, color, id);
    return this.findById(id);
  }

  delete(id) {
    return db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }
}

module.exports = new ProjectRepository();
