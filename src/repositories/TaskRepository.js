const db = require('../../database');

class TaskRepository {
  findFiltered({ category_id, project_id, status, filter, search, priority }) {
    let sql = `
      SELECT t.*, p.name as project_name, p.color as project_color, c.id as category_id, c.name as category_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      sql += ` AND c.id = ?`;
      params.push(category_id);
    }

    if (project_id) {
      sql += ` AND t.project_id = ?`;
      params.push(project_id);
    }

    if (status) {
      sql += ` AND t.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const nowISO = new Date().toISOString().slice(0, 16);
    const todayEndISO = new Date(new Date().setHours(23, 59, 59, 999)).toISOString().slice(0, 16);
    const next7DaysISO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

    if (filter === 'today') {
      sql += ` AND t.due_date IS NOT NULL AND t.due_date <= ? AND t.status != 'done'`;
      params.push(todayEndISO);
    } else if (filter === 'upcoming') {
      sql += ` AND t.due_date IS NOT NULL AND t.due_date > ? AND t.due_date <= ? AND t.status != 'done'`;
      params.push(todayEndISO, next7DaysISO);
    } else if (filter === 'overdue') {
      sql += ` AND t.due_date IS NOT NULL AND t.due_date < ? AND t.status != 'done'`;
      params.push(nowISO);
    }

    sql += ` ORDER BY t.priority ASC, t.due_date ASC, t.id DESC`;

    let tasks = db.prepare(sql).all(...params);

    if (priority) {
      tasks = tasks.filter(t => t.priority == priority);
    }

    return tasks;
  }

  findById(id) {
    return db.prepare(`
      SELECT t.*, p.name as project_name, p.color as project_color, c.id as category_id, c.name as category_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE t.id = ?
    `).get(id);
  }

  create({ project_id, title, description, due_date, priority, status, reminder_frequency }) {
    const insertTask = db.prepare(`
      INSERT INTO tasks (project_id, title, description, due_date, priority, status, reminder_frequency)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertTask.run(
      project_id,
      title,
      description || '',
      due_date || null,
      priority || 3,
      status || 'todo',
      reminder_frequency || 'smart'
    );

    return info.lastInsertRowid;
  }

  update(id, { project_id, title, description, due_date, priority, status, reminder_frequency }) {
    const stmt = db.prepare(`
      UPDATE tasks
      SET project_id = ?, title = ?, description = ?, due_date = ?, priority = ?, status = ?, reminder_frequency = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      project_id,
      title,
      description || '',
      due_date || null,
      priority || 3,
      status || 'todo',
      reminder_frequency || 'smart',
      id
    );
  }

  updateStatus(id, status) {
    db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  }

  delete(id) {
    return db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  }
}

module.exports = new TaskRepository();
