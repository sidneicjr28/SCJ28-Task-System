const db = require('../../database');

class CategoryRepository {
  findAll() {
    return db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
  }

  findById(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  findByName(name) {
    return db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
  }

  create({ name, icon, color }) {
    const stmt = db.prepare('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)');
    const info = stmt.run(name, icon || 'folder', color || '#ff3333');
    return this.findById(info.lastInsertRowid);
  }

  update(id, { name, icon, color }) {
    const stmt = db.prepare(`
      UPDATE categories
      SET name = COALESCE(?, name),
          icon = COALESCE(?, icon),
          color = COALESCE(?, color)
      WHERE id = ?
    `);
    stmt.run(name, icon, color, id);
    return this.findById(id);
  }

  delete(id) {
    return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }
}

module.exports = new CategoryRepository();
