const db = require('../../database');
const settingsService = require('./SettingsService');

class BackupService {
  exportData() {
    const categories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
    const projects = db.prepare('SELECT * FROM projects ORDER BY id ASC').all();
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY id ASC').all();
    const subtasks = db.prepare('SELECT * FROM subtasks ORDER BY id ASC').all();
    const diaries = db.prepare('SELECT * FROM diaries ORDER BY id ASC').all();
    const diary_tasks = db.prepare('SELECT * FROM diary_tasks ORDER BY diary_id ASC, task_id ASC').all();
    const settings = settingsService.getSettings();

    return {
      version: 2,
      exported_at: new Date().toISOString(),
      settings,
      categories,
      projects,
      tasks,
      subtasks,
      diaries,
      diary_tasks
    };
  }

  importData({ settings, categories = [], projects = [], tasks = [], subtasks = [], diaries = [], diary_tasks = [], mode = 'replace' }) {
    if (settings && typeof settings === 'object') {
      settingsService.saveSettings(settings);
    }
    const importTx = db.transaction(() => {
      if (mode === 'replace') {
        db.prepare('DELETE FROM diary_tasks').run();
        db.prepare('DELETE FROM diaries').run();
        db.prepare('DELETE FROM subtasks').run();
        db.prepare('DELETE FROM tasks').run();
        db.prepare('DELETE FROM projects').run();
        db.prepare('DELETE FROM categories').run();
      }

      // 1. Categories
      const categoryIdMap = new Map();
      const insertCatWithId = db.prepare('INSERT INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)');
      const insertCatAuto = db.prepare('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)');
      const getCatByName = db.prepare('SELECT id FROM categories WHERE name = ?');

      for (const cat of categories) {
        if (mode === 'replace' && cat.id) {
          insertCatWithId.run(cat.id, cat.name, cat.icon || 'folder', cat.color || '#ff3333');
          categoryIdMap.set(cat.id, cat.id);
        } else {
          let existing = getCatByName.get(cat.name);
          if (existing) {
            categoryIdMap.set(cat.id, existing.id);
          } else {
            const info = insertCatAuto.run(cat.name, cat.icon || 'folder', cat.color || '#ff3333');
            categoryIdMap.set(cat.id, info.lastInsertRowid);
          }
        }
      }

      // 2. Projects
      const projectIdMap = new Map();
      const insertProjWithId = db.prepare('INSERT INTO projects (id, category_id, name, description, color, github_repo, github_project_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      const insertProjAuto = db.prepare('INSERT INTO projects (category_id, name, description, color, github_repo, github_project_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const getProjByNameCat = db.prepare('SELECT id FROM projects WHERE category_id = ? AND name = ?');

      for (const proj of projects) {
        const mappedCatId = categoryIdMap.get(proj.category_id) || proj.category_id;
        if (!mappedCatId) continue;

        if (mode === 'replace' && proj.id) {
          insertProjWithId.run(proj.id, mappedCatId, proj.name, proj.description || '', proj.color || '#ffffff', proj.github_repo || null, proj.github_project_id || null, proj.created_at || new Date().toISOString());
          projectIdMap.set(proj.id, proj.id);
        } else {
          let existing = getProjByNameCat.get(mappedCatId, proj.name);
          if (existing) {
            projectIdMap.set(proj.id, existing.id);
          } else {
            const info = insertProjAuto.run(mappedCatId, proj.name, proj.description || '', proj.color || '#ffffff', proj.github_repo || null, proj.github_project_id || null, proj.created_at || new Date().toISOString());
            projectIdMap.set(proj.id, info.lastInsertRowid);
          }
        }
      }

      // 3. Tasks
      const taskIdMap = new Map();
      const insertTaskWithId = db.prepare('INSERT INTO tasks (id, project_id, title, description, due_date, priority, status, reminder_frequency, github_issue_id, github_issue_number, github_issue_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      const insertTaskAuto = db.prepare('INSERT INTO tasks (project_id, title, description, due_date, priority, status, reminder_frequency, github_issue_id, github_issue_number, github_issue_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

      for (const task of tasks) {
        const mappedProjId = projectIdMap.get(task.project_id) || task.project_id;
        if (!mappedProjId) continue;

        const remFreq = task.reminder_frequency || 'smart';
        if (mode === 'replace' && task.id) {
          insertTaskWithId.run(task.id, mappedProjId, task.title, task.description || '', task.due_date || null, task.priority || 3, task.status || 'todo', remFreq, task.github_issue_id || null, task.github_issue_number || null, task.github_issue_url || null, task.created_at || new Date().toISOString(), task.updated_at || new Date().toISOString());
          taskIdMap.set(task.id, task.id);
        } else {
          const info = insertTaskAuto.run(mappedProjId, task.title, task.description || '', task.due_date || null, task.priority || 3, task.status || 'todo', remFreq, task.github_issue_id || null, task.github_issue_number || null, task.github_issue_url || null, task.created_at || new Date().toISOString(), task.updated_at || new Date().toISOString());
          taskIdMap.set(task.id, info.lastInsertRowid);
        }
      }

      // 4. Subtasks
      const insertSub = db.prepare('INSERT INTO subtasks (task_id, title, completed, position) VALUES (?, ?, ?, ?)');
      for (const sub of subtasks) {
        const mappedTaskId = taskIdMap.get(sub.task_id) || sub.task_id;
        if (!mappedTaskId) continue;

        insertSub.run(mappedTaskId, sub.title, sub.completed ? 1 : 0, sub.position || 0);
      }

      // 5. Diaries
      const diaryIdMap = new Map();
      const insertDiaryWithId = db.prepare('INSERT INTO diaries (id, project_id, category_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const insertDiaryAuto = db.prepare('INSERT INTO diaries (project_id, category_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');

      for (const d of diaries) {
        const mappedProjId = d.project_id ? (projectIdMap.get(d.project_id) || d.project_id) : null;
        const mappedCatId = d.category_id ? (categoryIdMap.get(d.category_id) || d.category_id) : null;

        if (mode === 'replace' && d.id) {
          insertDiaryWithId.run(d.id, mappedProjId, mappedCatId, d.title, d.content || '', d.created_at || new Date().toISOString(), d.updated_at || new Date().toISOString());
          diaryIdMap.set(d.id, d.id);
        } else {
          const info = insertDiaryAuto.run(mappedProjId, d.title, d.content || '', d.created_at || new Date().toISOString(), d.updated_at || new Date().toISOString());
          diaryIdMap.set(d.id, info.lastInsertRowid);
        }
      }

      // 6. Diary Tasks
      const insertDiaryTask = db.prepare('INSERT INTO diary_tasks (diary_id, task_id) VALUES (?, ?)');
      for (const dt of diary_tasks) {
        const mappedDiaryId = diaryIdMap.get(dt.diary_id) || dt.diary_id;
        const mappedTaskId = taskIdMap.get(dt.task_id) || dt.task_id;
        if (!mappedDiaryId || !mappedTaskId) continue;

        try {
          insertDiaryTask.run(mappedDiaryId, mappedTaskId);
        } catch (e) {
          // ignore duplicate entry errors
        }
      }
    });

    importTx();

    return {
      message: 'Data imported successfully',
      counts: {
        categories: categories.length,
        projects: projects.length,
        tasks: tasks.length,
        subtasks: subtasks.length,
        diaries: diaries.length
      }
    };
  }
}

module.exports = new BackupService();
