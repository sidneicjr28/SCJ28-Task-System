const db = require('../../database');

class SubtaskRepository {
  findByTaskId(taskId) {
    return db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC').all(taskId);
  }

  findById(id) {
    return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id);
  }

  create(taskId, title, completed = 0, position = 0) {
    const stmt = db.prepare('INSERT INTO subtasks (task_id, title, completed, position) VALUES (?, ?, ?, ?)');
    return stmt.run(taskId, title, completed ? 1 : 0, position);
  }

  deleteByTaskId(taskId) {
    return db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(taskId);
  }

  toggle(id) {
    const subtask = this.findById(id);
    if (!subtask) return null;

    const newCompleted = subtask.completed ? 0 : 1;
    db.prepare('UPDATE subtasks SET completed = ? WHERE id = ?').run(newCompleted, id);
    return { id: Number(id), completed: newCompleted };
  }
}

module.exports = new SubtaskRepository();
