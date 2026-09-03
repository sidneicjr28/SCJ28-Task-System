const db = require('../../database');

class StatsService {
  getStats() {
    const nowISO = new Date().toISOString().slice(0, 16);
    const todayEndISO = new Date(new Date().setHours(23, 59, 59, 999)).toISOString().slice(0, 16);

    const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'").get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status != 'done'").get().count;
    const overdue = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE due_date IS NOT NULL AND due_date < ? AND status != 'done'").get(nowISO).count;
    const dueToday = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE due_date IS NOT NULL AND due_date <= ? AND status != 'done'").get(todayEndISO).count;

    return { total, completed, pending, overdue, dueToday };
  }
}

module.exports = new StatsService();
