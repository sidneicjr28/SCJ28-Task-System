const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'tasks.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT 'folder',
      color TEXT DEFAULT '#ff3333'
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#ffffff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      priority INTEGER DEFAULT 3, -- 1: P1 Urgent, 2: P2 High, 3: P3 Medium, 4: P4 Low
      status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
      reminder_frequency TEXT DEFAULT 'smart', -- 'smart', 'hourly', 'every_3h', 'twice_daily', 'daily', 'due_only', 'none'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      position INTEGER DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  // Migration: Ensure reminder_frequency column exists for existing databases
  try {
    const tableInfo = db.pragma('table_info(tasks)');
    const hasReminderCol = tableInfo.some(col => col.name === 'reminder_frequency');
    if (!hasReminderCol) {
      db.exec("ALTER TABLE tasks ADD COLUMN reminder_frequency TEXT DEFAULT 'smart'");
    }
  } catch (err) {
    console.error('Migration error adding reminder_frequency:', err);
  }
}

initDb();

module.exports = db;
