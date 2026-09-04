const db = require('../../database');

class DiaryRepository {
  findFiltered({ category_id, project_id, search }) {
    let sql = `
      SELECT d.*, 
             p.name as project_name, p.color as project_color,
             c.name as category_name
      FROM diaries d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN categories c ON (d.category_id = c.id OR p.category_id = c.id)
      WHERE 1=1
    `;
    const params = [];

    if (project_id) {
      sql += ` AND d.project_id = ?`;
      params.push(project_id);
    } else if (category_id) {
      sql += ` AND (d.category_id = ? OR p.category_id = ?)`;
      params.push(category_id, category_id);
    }

    if (search) {
      sql += ` AND (d.title LIKE ? OR d.content LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY d.updated_at DESC, d.id DESC`;

    const diaries = db.prepare(sql).all(...params);

    // Fetch attached tasks for each diary
    for (const diary of diaries) {
      diary.attached_tasks = this.getAttachedTasks(diary.id);
    }

    return diaries;
  }

  findById(id) {
    const diary = db.prepare(`
      SELECT d.*, 
             p.name as project_name, p.color as project_color,
             c.name as category_name
      FROM diaries d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN categories c ON (d.category_id = c.id OR p.category_id = c.id)
      WHERE d.id = ?
    `).get(id);

    if (diary) {
      diary.attached_tasks = this.getAttachedTasks(id);
    }

    return diary;
  }

  getAttachedTasks(diaryId) {
    return db.prepare(`
      SELECT t.id, t.title, t.status, t.priority, t.due_date
      FROM tasks t
      JOIN diary_tasks dt ON t.id = dt.task_id
      WHERE dt.diary_id = ?
      ORDER BY t.id ASC
    `).all(diaryId);
  }

  setAttachedTasks(diaryId, taskIds = []) {
    db.prepare(`DELETE FROM diary_tasks WHERE diary_id = ?`).run(diaryId);
    const stmt = db.prepare(`INSERT INTO diary_tasks (diary_id, task_id) VALUES (?, ?)`);
    for (const taskId of taskIds) {
      stmt.run(diaryId, taskId);
    }
  }

  create({ project_id, category_id, title, content, task_ids = [] }) {
    const createTx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO diaries (project_id, category_id, title, content)
        VALUES (?, ?, ?, ?)
      `);

      const info = stmt.run(
        project_id || null,
        category_id || null,
        title,
        content || ''
      );

      const diaryId = info.lastInsertRowid;
      if (task_ids && task_ids.length > 0) {
        this.setAttachedTasks(diaryId, task_ids);
      }

      return diaryId;
    });

    const newId = createTx();
    return this.findById(newId);
  }

  update(id, { project_id, category_id, title, content, task_ids }) {
    const updateTx = db.transaction(() => {
      const stmt = db.prepare(`
        UPDATE diaries
        SET project_id = ?, category_id = ?, title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(
        project_id || null,
        category_id || null,
        title,
        content || '',
        id
      );

      if (task_ids !== undefined) {
        this.setAttachedTasks(id, task_ids);
      }
    });

    updateTx();
    return this.findById(id);
  }

  delete(id) {
    return db.prepare(`DELETE FROM diaries WHERE id = ?`).run(id);
  }
}

module.exports = new DiaryRepository();
