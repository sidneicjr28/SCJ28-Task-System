// SCJ28 Task Manager Client Application (SOLID Architecture Entry Orchestrator)

import { store } from './state/store.js';
import { apiService } from './services/apiService.js';
import { notificationService } from './services/notificationService.js';
import { pwaService } from './services/pwaService.js';
import { modalManager } from './ui/modalManager.js';
import { showToast, escapeHtml } from './ui/toast.js';

import { renderCategoriesTree, renderProjectSelectOptions } from './renderers/categoryRenderer.js';
import { renderTasksList } from './renderers/listRenderer.js';
import { renderKanbanBoard } from './renderers/kanbanRenderer.js';
import { renderCalendarView } from './renderers/calendarRenderer.js';
import { renderStats } from './renderers/statsRenderer.js';

document.addEventListener('DOMContentLoaded', () => {
  let pendingImportData = null;

  // DOM Elements Map
  const el = {
    categoriesTree: document.getElementById('categories-tree'),
    tasksListContainer: document.getElementById('tasks-list-container'),
    statTotal: document.getElementById('stat-total'),
    statPending: document.getElementById('stat-pending'),
    statOverdue: document.getElementById('stat-overdue'),
    statCompleted: document.getElementById('stat-completed'),
    cntAll: document.getElementById('cnt-all'),
    cntToday: document.getElementById('cnt-today'),
    cntUpcoming: document.getElementById('cnt-upcoming'),
    cntOverdue: document.getElementById('cnt-overdue'),
    viewTitle: document.getElementById('current-view-title'),
    viewSubtitle: document.getElementById('current-view-subtitle'),
    inputSearch: document.getElementById('input-search'),
    filterStatus: document.getElementById('filter-status'),
    filterPriority: document.getElementById('filter-priority'),
    modalTask: document.getElementById('modal-task'),
    modalTaskTitle: document.getElementById('modal-task-title'),
    modalProject: document.getElementById('modal-project'),
    modalCategory: document.getElementById('modal-category'),
    modalDataOptions: document.getElementById('modal-data-options'),
    modalImport: document.getElementById('modal-import'),
    btnDataMenu: document.getElementById('btn-data-menu'),
    btnModalExport: document.getElementById('btn-modal-export'),
    btnModalImport: document.getElementById('btn-modal-import'),
    inputImportFile: document.getElementById('input-import-file'),
    btnConfirmImport: document.getElementById('btn-confirm-import'),
    formTask: document.getElementById('form-task'),
    formProject: document.getElementById('form-project'),
    formCategory: document.getElementById('form-category'),
    taskId: document.getElementById('task-id'),
    taskTitle: document.getElementById('task-title'),
    taskProject: document.getElementById('task-project'),
    taskPriority: document.getElementById('task-priority'),
    taskDueDate: document.getElementById('task-due-date'),
    taskStatus: document.getElementById('task-status'),
    taskReminder: document.getElementById('task-reminder'),
    taskDesc: document.getElementById('task-desc'),
    subtasksEditorList: document.getElementById('subtasks-editor-list'),
    btnAddSubtaskRow: document.getElementById('btn-add-subtask-row'),
    kbCardsTodo: document.getElementById('kb-cards-todo'),
    kbCardsInProgress: document.getElementById('kb-cards-in-progress'),
    kbCardsDone: document.getElementById('kb-cards-done'),
    kbCountTodo: document.getElementById('kb-count-todo'),
    kbCountInProgress: document.getElementById('kb-count-in-progress'),
    kbCountDone: document.getElementById('kb-count-done'),
    calendarDays: document.getElementById('calendar-days'),
    calMonthYear: document.getElementById('cal-month-year'),
    calPrev: document.getElementById('cal-prev'),
    calNext: document.getElementById('cal-next'),
    calToday: document.getElementById('cal-today')
  };

  init();

  async function init() {
    setupEventListeners();
    notificationService.init();
    pwaService.init();

    // Subscribe store listener to auto-render current view when state changes
    store.subscribe(() => renderCurrentView());

    await loadCategories();
    await loadTasks();
    await loadStats();

    notificationService.checkAndSendDueNotifications(store.getState().tasks);
    setInterval(() => {
      notificationService.checkAndSendDueNotifications(store.getState().tasks);
    }, 60000);
  }

  // ----------------------------------------------------
  // Data Loaders
  // ----------------------------------------------------

  async function loadCategories() {
    try {
      const categories = await apiService.getCategories();
      store.setState({ categories });
      renderCategoriesTree(el.categoriesTree, categories, store.getState());
      renderProjectSelectOptions(el.taskProject, categories);
    } catch (err) {
      showToast('Error loading categories: ' + err.message);
    }
  }

  async function loadTasks() {
    try {
      const state = store.getState();
      const tasks = await apiService.getTasks({
        filter: state.activeFilter,
        category_id: state.activeCategory,
        project_id: state.activeProject,
        search: state.searchQuery,
        status: state.filterStatus,
        priority: state.filterPriority
      });
      store.setState({ tasks });
    } catch (err) {
      showToast('Error loading tasks: ' + err.message);
    }
  }

  async function loadStats() {
    try {
      const stats = await apiService.getStats();
      store.setState({ stats });
      renderStats(el, stats);
    } catch (err) {
      console.error(err);
    }
  }

  // ----------------------------------------------------
  // Render Coordinator
  // ----------------------------------------------------

  function renderCurrentView() {
    const state = store.getState();
    if (state.currentView === 'list') {
      renderTasksList(el.tasksListContainer, state.tasks);
    } else if (state.currentView === 'kanban') {
      renderKanbanBoard(el, state.tasks, updateTaskStatus);
    } else if (state.currentView === 'calendar') {
      renderCalendarView(el, state.tasks, state.calendarDate, openEditTaskModal);
    }
    renderStats(el, state.stats);
  }

  // ----------------------------------------------------
  // Task Actions
  // ----------------------------------------------------

  async function updateTaskStatus(taskId, status) {
    try {
      await apiService.updateTaskStatus(taskId, status);
      await loadTasks();
      await loadStats();
    } catch (err) {
      showToast('Error updating status: ' + err.message);
    }
  }

  async function toggleSubtask(subtaskId) {
    try {
      await apiService.toggleSubtask(subtaskId);
      await loadTasks();
    } catch (err) {
      showToast('Error toggling subtask: ' + err.message);
    }
  }

  async function deleteTask(taskId) {
    try {
      await apiService.deleteTask(taskId);
      showToast('Task deleted');
      await loadTasks();
      await loadStats();
    } catch (err) {
      showToast('Error deleting task: ' + err.message);
    }
  }

  // ----------------------------------------------------
  // Modal Handlers
  // ----------------------------------------------------

  function openCreateTaskModal() {
    store.setState({ editingTaskId: null });
    if (el.modalTaskTitle) el.modalTaskTitle.textContent = 'Create New Task';
    el.formTask.reset();
    if (el.taskReminder) el.taskReminder.value = 'smart';
    el.subtasksEditorList.innerHTML = '';

    const state = store.getState();
    if (state.activeProject) {
      el.taskProject.value = state.activeProject;
    } else if (state.activeCategory) {
      const cat = state.categories.find(c => c.id === state.activeCategory);
      if (cat && cat.projects && cat.projects.length > 0) {
        el.taskProject.value = cat.projects[0].id;
      }
    }

    addSubtaskRow();
    addSubtaskRow();

    modalManager.openModal(el.modalTask);
  }

  function openEditTaskModal(taskId) {
    const task = store.getState().tasks.find(t => t.id == taskId);
    if (!task) return;

    store.setState({ editingTaskId: task.id });
    if (el.modalTaskTitle) el.modalTaskTitle.textContent = 'Edit Task';

    el.taskId.value = task.id;
    el.taskTitle.value = task.title;
    el.taskProject.value = task.project_id;
    el.taskPriority.value = task.priority;
    el.taskDueDate.value = task.due_date ? task.due_date.slice(0, 16) : '';
    el.taskStatus.value = task.status;
    if (el.taskReminder) el.taskReminder.value = task.reminder_frequency || 'smart';
    el.taskDesc.value = task.description || '';

    el.subtasksEditorList.innerHTML = '';
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(st => addSubtaskRow(st.title, st.completed));
    } else {
      addSubtaskRow();
    }

    modalManager.openModal(el.modalTask);
  }

  function openProjectModal(categoryId) {
    document.getElementById('project-category-id').value = categoryId;
    el.formProject.reset();
    modalManager.openModal(el.modalProject);
  }

  function addSubtaskRow(title = '', completed = false) {
    const row = document.createElement('div');
    row.className = 'subtask-editor-row';
    row.innerHTML = `
      <input type="checkbox" class="subtask-row-completed" ${completed ? 'checked' : ''}>
      <input type="text" class="subtask-row-title" value="${escapeHtml(title)}" placeholder="Checklist item title...">
      <button type="button" class="icon-btn-sm btn-remove-subtask-row"><i data-lucide="trash"></i></button>
    `;

    row.querySelector('.btn-remove-subtask-row').addEventListener('click', () => {
      row.remove();
    });

    el.subtasksEditorList.appendChild(row);
    if (window.lucide) window.lucide.createIcons();
  }

  // ----------------------------------------------------
  // Form Submissions
  // ----------------------------------------------------

  async function handleTaskFormSubmit(e) {
    e.preventDefault();

    const subtasks = [];
    document.querySelectorAll('.subtask-editor-row').forEach(row => {
      const title = row.querySelector('.subtask-row-title').value.trim();
      const completed = row.querySelector('.subtask-row-completed').checked;
      if (title) {
        subtasks.push({ title, completed });
      }
    });

    const payload = {
      project_id: Number(el.taskProject.value),
      title: el.taskTitle.value.trim(),
      description: el.taskDesc.value.trim(),
      due_date: el.taskDueDate.value || null,
      priority: Number(el.taskPriority.value),
      status: el.taskStatus.value,
      reminder_frequency: el.taskReminder.value,
      subtasks
    };

    try {
      const state = store.getState();
      if (state.editingTaskId) {
        await apiService.updateTask(state.editingTaskId, payload);
        showToast('Task updated successfully!');
      } else {
        await apiService.createTask(payload);
        showToast('Task created successfully!');
      }

      modalManager.closeModal(el.modalTask);
      await loadTasks();
      await loadStats();
    } catch (err) {
      showToast('Error saving task: ' + err.message);
    }
  }

  async function handleProjectFormSubmit(e) {
    e.preventDefault();

    const payload = {
      category_id: Number(document.getElementById('project-category-id').value),
      name: document.getElementById('project-name').value.trim(),
      description: document.getElementById('project-desc').value.trim(),
      color: document.getElementById('project-color').value
    };

    try {
      await apiService.createProject(payload);
      modalManager.closeModal(el.modalProject);
      showToast('Project created!');
      await loadCategories();
    } catch (err) {
      showToast('Error creating project: ' + err.message);
    }
  }

  async function handleCategoryFormSubmit(e) {
    e.preventDefault();

    const payload = {
      name: document.getElementById('category-name').value.trim(),
      icon: document.getElementById('category-icon').value
    };

    try {
      await apiService.createCategory(payload);
      modalManager.closeModal(el.modalCategory);
      showToast('Category created!');
      await loadCategories();
    } catch (err) {
      showToast('Error creating category: ' + err.message);
    }
  }

  // ----------------------------------------------------
  // Import & Export Handlers
  // ----------------------------------------------------

  async function handleExportData() {
    try {
      const data = await apiService.exportBackup();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `scj28_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Database exported to JSON file!');
    } catch (err) {
      showToast('Error exporting data: ' + err.message);
    }
  }

  function handleImportFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid JSON structure');
        }

        pendingImportData = data;
        document.getElementById('import-filename').textContent = file.name;

        const catCount = Array.isArray(data.categories) ? data.categories.length : 0;
        const projCount = Array.isArray(data.projects) ? data.projects.length : 0;
        const taskCount = Array.isArray(data.tasks) ? data.tasks.length : 0;
        const subCount = Array.isArray(data.subtasks) ? data.subtasks.length : 0;

        document.getElementById('import-summary').innerHTML = `
          📌 <strong>Found in backup:</strong><br>
          • Categories: ${catCount}<br>
          • Projects: ${projCount}<br>
          • Tasks: ${taskCount}<br>
          • Subtasks: ${subCount}
        `;

        modalManager.openModal(el.modalImport);
      } catch (err) {
        showToast('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleConfirmImport() {
    if (!pendingImportData) return;

    const mode = document.querySelector('input[name="import-mode"]:checked')?.value || 'replace';

    try {
      await apiService.importBackup({ ...pendingImportData, mode });
      modalManager.closeModal(el.modalImport);
      showToast('Database imported successfully!');
      pendingImportData = null;
      await loadCategories();
      await loadTasks();
      await loadStats();
    } catch (err) {
      showToast('Error importing data: ' + err.message);
    }
  }

  // ----------------------------------------------------
  // Event Listeners Setup
  // ----------------------------------------------------

  function setupEventListeners() {
    // Mobile sidebar toggle
    document.getElementById('btn-mobile-toggle').addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('mobile-open');
    });

    // View mode toggles
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');

        const currentView = targetBtn.dataset.view;
        store.setState({ currentView });

        document.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(`view-${currentView}`).classList.add('active');

        renderCurrentView();
      });
    });

    // Smart Filter sidebar clicks
    document.querySelectorAll('.nav-item[data-filter]').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const activeFilter = item.dataset.filter;
        store.setState({ activeFilter, activeCategory: null, activeProject: null });

        el.viewTitle.textContent = item.querySelector('span').textContent;
        el.viewSubtitle.textContent = `Filtered view: ${activeFilter}`;

        loadTasks();
      });
    });

    // Category tree clicks
    el.categoriesTree.addEventListener('click', (e) => {
      const catHeader = e.target.closest('.category-header');
      const projItem = e.target.closest('.project-item');
      const btnAddProj = e.target.closest('.btn-add-proj');

      if (btnAddProj) {
        e.stopPropagation();
        openProjectModal(btnAddProj.dataset.catId);
        return;
      }

      if (catHeader) {
        document.querySelectorAll('.nav-item, .category-header, .project-item').forEach(i => i.classList.remove('active'));
        catHeader.classList.add('active');

        const catId = Number(catHeader.dataset.catId);
        store.setState({ activeCategory: catId, activeProject: null, activeFilter: 'all' });

        const catObj = store.getState().categories.find(c => c.id === catId);
        el.viewTitle.textContent = catObj ? catObj.name : 'Category Tasks';
        el.viewSubtitle.textContent = 'All tasks under this category';

        loadTasks();
      }

      if (projItem) {
        document.querySelectorAll('.nav-item, .category-header, .project-item').forEach(i => i.classList.remove('active'));
        projItem.classList.add('active');

        const projId = Number(projItem.dataset.projId);
        store.setState({ activeProject: projId, activeCategory: null, activeFilter: 'all' });

        let projName = 'Project Tasks';
        store.getState().categories.forEach(c => {
          const p = (c.projects || []).find(pj => pj.id === projId);
          if (p) projName = p.name;
        });

        el.viewTitle.textContent = projName;
        el.viewSubtitle.textContent = 'Project specific task view';

        loadTasks();
      }
    });

    // Search box debounce
    let searchDebounce;
    el.inputSearch.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        store.setState({ searchQuery: e.target.value.trim() });
        loadTasks();
      }, 250);
    });

    // Filter dropdowns
    el.filterStatus.addEventListener('change', (e) => {
      store.setState({ filterStatus: e.target.value });
      loadTasks();
    });

    el.filterPriority.addEventListener('change', (e) => {
      store.setState({ filterPriority: e.target.value });
      loadTasks();
    });

    // Tasks list delegation clicks
    el.tasksListContainer.addEventListener('click', async (e) => {
      const chk = e.target.closest('.task-checkbox');
      const btnEdit = e.target.closest('.btn-edit-task');
      const btnDel = e.target.closest('.btn-delete-task');
      const chkSub = e.target.closest('.chk-subtask');

      if (chk) {
        const nextStatus = chk.dataset.currentStatus === 'done' ? 'todo' : 'done';
        await updateTaskStatus(chk.dataset.taskId, nextStatus);
      }
      if (btnEdit) openEditTaskModal(btnEdit.dataset.taskId);
      if (btnDel) {
        if (confirm('Are you sure you want to delete this task?')) {
          await deleteTask(btnDel.dataset.taskId);
        }
      }
      if (chkSub) await toggleSubtask(chkSub.dataset.subId);
    });

    // Kanban view edit/delete clicks
    document.querySelectorAll('.kanban-cards').forEach(container => {
      container.addEventListener('click', async (e) => {
        const btnEdit = e.target.closest('.btn-edit-task');
        const btnDel = e.target.closest('.btn-delete-task');

        if (btnEdit) openEditTaskModal(btnEdit.dataset.taskId);
        if (btnDel) {
          if (confirm('Are you sure you want to delete this task?')) {
            await deleteTask(btnDel.dataset.taskId);
          }
        }
      });
    });

    // Modal Triggers
    document.getElementById('btn-new-task-sidebar').addEventListener('click', () => openCreateTaskModal());
    document.getElementById('btn-new-task-header').addEventListener('click', () => openCreateTaskModal());
    document.getElementById('btn-add-category').addEventListener('click', () => modalManager.openModal(el.modalCategory));

    // Modal Close triggers
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.close;
        modalManager.closeModal(document.getElementById(modalId));
      });
    });

    // Form Submissions
    el.formTask.addEventListener('submit', handleTaskFormSubmit);
    el.formProject.addEventListener('submit', handleProjectFormSubmit);
    el.formCategory.addEventListener('submit', handleCategoryFormSubmit);

    // Dynamic Subtasks Builder
    el.btnAddSubtaskRow.addEventListener('click', () => addSubtaskRow());

    // Import & Export Data Menu
    if (el.btnDataMenu) el.btnDataMenu.addEventListener('click', () => modalManager.openModal(el.modalDataOptions));
    if (el.btnModalExport) el.btnModalExport.addEventListener('click', () => { modalManager.closeModal(el.modalDataOptions); handleExportData(); });
    if (el.btnModalImport) el.btnModalImport.addEventListener('click', () => { modalManager.closeModal(el.modalDataOptions); el.inputImportFile.click(); });
    if (el.inputImportFile) el.inputImportFile.addEventListener('change', handleImportFileSelect);
    if (el.btnConfirmImport) el.btnConfirmImport.addEventListener('click', handleConfirmImport);

    // Calendar Controls
    el.calPrev.addEventListener('click', () => {
      const calDate = store.getState().calendarDate;
      calDate.setMonth(calDate.getMonth() - 1);
      store.setState({ calendarDate: calDate });
      renderCurrentView();
    });
    el.calNext.addEventListener('click', () => {
      const calDate = store.getState().calendarDate;
      calDate.setMonth(calDate.getMonth() + 1);
      store.setState({ calendarDate: calDate });
      renderCurrentView();
    });
    el.calToday.addEventListener('click', () => {
      store.setState({ calendarDate: new Date() });
      renderCurrentView();
    });
  }
});
