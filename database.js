const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'tasks.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for multi-process concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

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

    CREATE TABLE IF NOT EXISTS diaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      category_id INTEGER,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diary_tasks (
      diary_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      PRIMARY KEY (diary_id, task_id),
      FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE CASCADE,
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

    const hasGhIssueId = tableInfo.some(col => col.name === 'github_issue_id');
    if (!hasGhIssueId) {
      db.exec("ALTER TABLE tasks ADD COLUMN github_issue_id INTEGER");
      db.exec("ALTER TABLE tasks ADD COLUMN github_issue_number INTEGER");
      db.exec("ALTER TABLE tasks ADD COLUMN github_issue_url TEXT");
    }

    const projTableInfo = db.pragma('table_info(projects)');
    const hasGhRepo = projTableInfo.some(col => col.name === 'github_repo');
    if (!hasGhRepo) {
      db.exec("ALTER TABLE projects ADD COLUMN github_repo TEXT");
      db.exec("ALTER TABLE projects ADD COLUMN github_project_id TEXT");
    }
  } catch (err) {
    console.error('Migration error adding GitHub columns:', err);
  }
}

initDb();

function gracefulShutdown() {
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
    db.close();
  } catch (err) {
    // Ignore if already closed
  }
}

process.on('SIGINT', () => { gracefulShutdown(); process.exit(0); });
process.on('SIGTERM', () => { gracefulShutdown(); process.exit(0); });

module.exports = db;

