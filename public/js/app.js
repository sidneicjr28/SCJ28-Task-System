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
import { renderDiariesList, parseMarkdown } from './renderers/diaryRenderer.js';
import { renderGitHubBoard } from './renderers/githubRenderer.js';

document.addEventListener('DOMContentLoaded', () => {
  let pendingImportData = null;

  // DOM Elements Map
  const el = {
    categoriesTree: document.getElementById('categories-tree'),
    tasksListContainer: document.getElementById('tasks-list-container'),
    diariesListContainer: document.getElementById('diaries-list-container'),
    viewDiaries: document.getElementById('view-diaries'),
    viewGithub: document.getElementById('view-github'),
    githubBoardContainer: document.getElementById('github-board-container'),
    contentSubtabs: document.getElementById('content-subtabs'),
    statTotal: document.getElementById('stat-total'),
    statPending: document.getElementById('stat-pending'),
    statOverdue: document.getElementById('stat-overdue'),
    statCompleted: document.getElementById('stat-completed'),
    cntAll: document.getElementById('cnt-all'),
    cntToday: document.getElementById('cnt-today'),
    cntUpcoming: document.getElementById('cnt-upcoming'),
    cntOverdue: document.getElementById('cnt-overdue'),
    cntDiaries: document.getElementById('cnt-diaries'),
    viewTitle: document.getElementById('current-view-title'),
    viewSubtitle: document.getElementById('current-view-subtitle'),
    inputSearch: document.getElementById('input-search'),
    inputDiarySearch: document.getElementById('input-diary-search'),
    filterStatus: document.getElementById('filter-status'),
    filterPriority: document.getElementById('filter-priority'),
    modalTask: document.getElementById('modal-task'),
    modalTaskTitle: document.getElementById('modal-task-title'),
    modalProject: document.getElementById('modal-project'),
    modalCategory: document.getElementById('modal-category'),
    modalDiary: document.getElementById('modal-diary'),
    modalDataOptions: document.getElementById('modal-data-options'),
    modalImport: document.getElementById('modal-import'),
    btnThemeSettings: document.getElementById('btn-theme-settings'),
    btnDataMenu: document.getElementById('btn-data-menu'),
    btnModalExport: document.getElementById('btn-modal-export'),
    btnModalImport: document.getElementById('btn-modal-import'),
    inputImportFile: document.getElementById('input-import-file'),
    btnConfirmImport: document.getElementById('btn-confirm-import'),
    btnNewDiary: document.getElementById('btn-new-diary'),
    formTask: document.getElementById('form-task'),
    formProject: document.getElementById('form-project'),
    formCategory: document.getElementById('form-category'),
    formDiary: document.getElementById('form-diary'),
    taskId: document.getElementById('task-id'),
    taskTitle: document.getElementById('task-title'),
    taskProject: document.getElementById('task-project'),
    taskPriority: document.getElementById('task-priority'),
    taskDueDate: document.getElementById('task-due-date'),
    taskStatus: document.getElementById('task-status'),
    taskReminder: document.getElementById('task-reminder'),
    taskDesc: document.getElementById('task-desc'),
    diaryId: document.getElementById('diary-id'),
    diaryTitle: document.getElementById('diary-title'),
    diaryProject: document.getElementById('diary-project'),
    diaryContent: document.getElementById('diary-content'),
    diaryTasksPicker: document.getElementById('diary-tasks-picker'),
    tabEditorWrite: document.getElementById('tab-editor-write'),
    tabEditorPreview: document.getElementById('tab-editor-preview'),
    editorPaneWrite: document.getElementById('editor-pane-write'),
    editorPanePreview: document.getElementById('editor-pane-preview'),
    btnSaveDiary: document.getElementById('btn-save-diary'),
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

    const savedOpacity = localStorage.getItem('scj28_panel_opacity') || 65;
    applyPanelOpacity(savedOpacity);

    await loadSettings();
    await loadBackgroundImage();
    await loadCategories();
    await loadTasks();
    await loadDiaries();
    await loadStats();

    notificationService.checkAndSendDueNotifications(store.getState().tasks);
    setInterval(() => {
      notificationService.checkAndSendDueNotifications(store.getState().tasks);
    }, 60000);
  }

  // ----------------------------------------------------
  // Dynamic Theme & Color Applicator
  // ----------------------------------------------------

  function applyAccentColor(hexColor) {
    if (!hexColor || !/^#([0-9A-F]{3}){1,2}$/i.test(hexColor)) return;
    
    let hex = hexColor;
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const darken = (col) => Math.max(0, Math.floor(col * 0.85));
    const hoverHex = `#${darken(r).toString(16).padStart(2, '0')}${darken(g).toString(16).padStart(2, '0')}${darken(b).toString(16).padStart(2, '0')}`;

    const root = document.documentElement;
    root.style.setProperty('--accent-red', hex);
    root.style.setProperty('--accent-red-hover', hoverHex);
    root.style.setProperty('--accent-red-glow', `rgba(${r}, ${g}, ${b}, 0.15)`);
    root.style.setProperty('--border-focus', hex);
    root.style.setProperty('--p1-color', hex);
  }

  function applyPanelOpacity(opacityVal) {
    let val = parseInt(opacityVal, 10);
    if (isNaN(val)) val = 65;
    val = Math.min(100, Math.max(60, val));

    const panelOpacityDec = (val / 100).toFixed(2);
    const relativeItemOpacity = (0.06 * (val / 65)).toFixed(2);

    document.documentElement.style.setProperty('--panel-opacity', panelOpacityDec);
    document.documentElement.style.setProperty('--item-opacity', relativeItemOpacity);
    localStorage.setItem('scj28_panel_opacity', val.toString());

    const opacityInput = document.getElementById('input-bkg-opacity');
    const opacityBadge = document.getElementById('opacity-val-badge');
    if (opacityInput) opacityInput.value = val;
    if (opacityBadge) opacityBadge.textContent = `${val}%`;
  }

  // ----------------------------------------------------
  // Data Loaders
  // ----------------------------------------------------

  async function loadSettings() {
    try {
      const settings = await apiService.getSettings();
      if (settings && settings.accentColor) {
        applyAccentColor(settings.accentColor);
        store.setState({ settings });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  }

  async function loadBackgroundImage() {
    try {
      const data = await apiService.getBackground();
      const bkgWrapper = document.getElementById('bkg-preview-wrapper');
      const bkgImg = document.getElementById('bkg-preview-img');
      const btnRemove = document.getElementById('btn-remove-bkg');

      if (data && data.imageUrl) {
        const timestampedUrl = `${data.imageUrl}?t=${Date.now()}`;
        document.body.style.backgroundImage = `url("${timestampedUrl}")`;
        if (bkgImg) bkgImg.src = timestampedUrl;
        if (bkgWrapper) bkgWrapper.style.display = 'block';
        if (btnRemove) btnRemove.style.display = 'inline-flex';
      } else {
        document.body.style.backgroundImage = 'none';
        if (bkgImg) bkgImg.src = '';
        if (bkgWrapper) bkgWrapper.style.display = 'none';
        if (btnRemove) btnRemove.style.display = 'none';
      }
    } catch (err) {
      console.error('Error loading background image:', err);
    }
  }

  async function handleBkgFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target.result;
        showToast('Uploading background image...');
        await apiService.uploadBackground({ image: base64Data, filename: file.name });
        await loadBackgroundImage();
        showToast('Background image applied successfully!');
      } catch (err) {
        showToast('Error uploading background image: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleRemoveBkg() {
    try {
      await apiService.removeBackground();
      await loadBackgroundImage();
      showToast('Background image removed.');
    } catch (err) {
      showToast('Error removing background image: ' + err.message);
    }
  }

  async function loadCategories() {
    try {
      const categories = await apiService.getCategories();
      store.setState({ categories });
      renderCategoriesTree(el.categoriesTree, categories, store.getState());
      renderProjectSelectOptions(el.taskProject, categories);
      renderProjectSelectOptions(el.diaryProject, categories);
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

  async function loadDiaries() {
    try {
      const state = store.getState();
      const params = {
        category_id: state.activeCategory,
        project_id: state.activeProject,
        search: state.searchQuery
      };
      const diaries = await apiService.getDiaries(params);
      store.setState({ diaries });
      if (el.cntDiaries) el.cntDiaries.textContent = diaries.length;
    } catch (err) {
      showToast('Error loading diaries: ' + err.message);
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

    // Update content-subtabs active button
    if (el.contentSubtabs) {
      const subtabBtns = el.contentSubtabs.querySelectorAll('.subtab-btn');
      subtabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
      });
    }

    const isDiariesView = state.activeTab === 'diaries' || state.activeFilter === 'diaries';
    const isGithubView = state.activeTab === 'github';

    if (isGithubView) {
      document.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
      if (el.viewGithub) el.viewGithub.classList.add('active');
      loadGitHubBoard(state.activeProject);
    } else if (isDiariesView) {
      if (el.viewGithub) el.viewGithub.classList.remove('active');
      document.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
      if (el.viewDiaries) el.viewDiaries.classList.add('active');
      renderDiariesList(el.diariesListContainer, state.diaries);
    } else {
      if (el.viewGithub) el.viewGithub.classList.remove('active');
      if (el.viewDiaries) el.viewDiaries.classList.remove('active');
      document.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
      const pane = document.getElementById(`view-${state.currentView}`);
      if (pane) pane.classList.add('active');

      if (state.currentView === 'list') {
        renderTasksList(el.tasksListContainer, state.tasks);
      } else if (state.currentView === 'kanban') {
        renderKanbanBoard(el, state.tasks, updateTaskStatus);
      } else if (state.currentView === 'calendar') {
        renderCalendarView(el, state.tasks, state.calendarDate, openEditTaskModal);
      }
    }

    renderStats(el, state.stats);
  }

  // ----------------------------------------------------
  // Task & Diary Actions
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

  async function deleteCategory(catId) {
    try {
      await apiService.deleteCategory(catId);
      showToast('Category deleted');
      const state = store.getState();
      if (state.activeCategory === Number(catId)) {
        store.setState({ activeCategory: null, activeFilter: 'all' });
        el.viewTitle.textContent = 'All Tasks';
        el.viewSubtitle.textContent = 'Overview of all active tasks';
      }
      await loadCategories();
      await loadTasks();
      await loadDiaries();
      await loadStats();
    } catch (err) {
      showToast('Error deleting category: ' + err.message);
    }
  }

  async function deleteProject(projId) {
    try {
      await apiService.deleteProject(projId);
      showToast('Project deleted');
      const state = store.getState();
      if (state.activeProject === Number(projId)) {
        store.setState({ activeProject: null, activeFilter: 'all' });
        el.viewTitle.textContent = 'All Tasks';
        el.viewSubtitle.textContent = 'Overview of all active tasks';
      }
      await loadCategories();
      await loadTasks();
      await loadDiaries();
      await loadStats();
    } catch (err) {
      showToast('Error deleting project: ' + err.message);
    }
  }

  // ----------------------------------------------------
  // Diary Functions & Modals
  // ----------------------------------------------------

  function openCreateDiaryModal() {
    store.setState({ editingDiaryId: null });
    const headTitle = document.getElementById('modal-diary-title-head');
    if (headTitle) headTitle.textContent = 'New Diary Entry';
    el.formDiary.reset();
    el.diaryId.value = '';

    if (el.editorPaneWrite) el.editorPaneWrite.style.display = 'block';
    if (el.editorPanePreview) el.editorPanePreview.style.display = 'none';
    if (el.tabEditorWrite) el.tabEditorWrite.classList.add('active');
    if (el.tabEditorPreview) el.tabEditorPreview.classList.remove('active');

    renderProjectSelectOptions(el.diaryProject, store.getState().categories);
    
    const state = store.getState();
    if (state.activeProject) {
      el.diaryProject.value = state.activeProject;
    }

    renderDiaryTasksPicker([]);
    modalManager.openModal(el.modalDiary);
  }

  async function openEditDiaryModal(diaryId) {
    try {
      const diary = await apiService.getDiaryById(diaryId);
      if (!diary) return;

      store.setState({ editingDiaryId: diary.id });
      const headTitle = document.getElementById('modal-diary-title-head');
      if (headTitle) headTitle.textContent = 'Edit Diary Entry';

      el.diaryId.value = diary.id;
      el.diaryTitle.value = diary.title;
      el.diaryContent.value = diary.content || '';

      if (el.editorPaneWrite) el.editorPaneWrite.style.display = 'block';
      if (el.editorPanePreview) el.editorPanePreview.style.display = 'none';
      if (el.tabEditorWrite) el.tabEditorWrite.classList.add('active');
      if (el.tabEditorPreview) el.tabEditorPreview.classList.remove('active');

      renderProjectSelectOptions(el.diaryProject, store.getState().categories);
      if (diary.project_id) el.diaryProject.value = diary.project_id;

      const attachedIds = (diary.attached_tasks || []).map(t => t.id);
      renderDiaryTasksPicker(attachedIds);

      modalManager.openModal(el.modalDiary);
    } catch (err) {
      showToast('Error loading diary details: ' + err.message);
    }
  }

  function renderDiaryTasksPicker(selectedTaskIds = []) {
    if (!el.diaryTasksPicker) return;
    el.diaryTasksPicker.innerHTML = '';

    const state = store.getState();
    let tasksToChoose = state.tasks;
    if (state.activeProject) {
      tasksToChoose = tasksToChoose.filter(t => t.project_id === state.activeProject);
    }

    if (tasksToChoose.length === 0) {
      el.diaryTasksPicker.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">No active tasks available to attach.</span>';
      return;
    }

    tasksToChoose.forEach(task => {
      const label = document.createElement('label');
      label.style.cssText = 'display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: var(--text-main); cursor: pointer;';
      const isChecked = selectedTaskIds.includes(task.id);
      label.innerHTML = `
        <input type="checkbox" name="diary-attached-task" value="${task.id}" ${isChecked ? 'checked' : ''}>
        <span>${escapeHtml(task.title)}</span>
      `;
      el.diaryTasksPicker.appendChild(label);
    });
  }

  async function handleDiaryFormSubmit(e) {
    e.preventDefault();
    const diaryIdVal = el.diaryId.value;
    const title = el.diaryTitle.value.trim();
    const content = el.diaryContent.value;
    const projIdVal = el.diaryProject.value;
    const project_id = projIdVal ? Number(projIdVal) : null;
    
    let category_id = store.getState().activeCategory;
    if (!project_id && !category_id) {
      const cats = store.getState().categories;
      if (cats.length > 0) category_id = cats[0].id;
    }

    const checkboxes = el.diaryTasksPicker.querySelectorAll('input[name="diary-attached-task"]:checked');
    const task_ids = Array.from(checkboxes).map(cb => Number(cb.value));

    const payload = {
      title,
      content,
      project_id,
      category_id,
      task_ids
    };

    try {
      if (diaryIdVal) {
        await apiService.updateDiary(diaryIdVal, payload);
        showToast('Diary entry updated successfully');
      } else {
        await apiService.createDiary(payload);
        showToast('Diary entry created successfully');
      }

      modalManager.closeModal(el.modalDiary);
      await loadDiaries();
    } catch (err) {
      showToast('Error saving diary: ' + err.message);
    }
  }

  async function deleteDiary(diaryId) {
    try {
      await apiService.deleteDiary(diaryId);
      showToast('Diary entry deleted');
      await loadDiaries();
    } catch (err) {
      showToast('Error deleting diary: ' + err.message);
    }
  }

  function handleDiaryContentPaste(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        e.preventDefault();
        const blob = item.getAsFile();
        const reader = new FileReader();

        reader.onload = async (event) => {
          try {
            showToast('Uploading pasted image...');
            const result = await apiService.uploadDiaryImage({
              image: event.target.result,
              name: blob.name || 'pasted_image.png'
            });

            const markdownImageTag = `\n![pasted image](${result.url})\n`;
            const cursorPos = el.diaryContent.selectionStart;
            const textBefore = el.diaryContent.value.substring(0, cursorPos);
            const textAfter = el.diaryContent.value.substring(cursorPos);
            el.diaryContent.value = textBefore + markdownImageTag + textAfter;

            showToast('Image pasted and uploaded successfully!');
          } catch (err) {
            showToast('Error uploading image: ' + err.message);
          }
        };

        reader.readAsDataURL(blob);
        break;
      }
    }
  }

  // ----------------------------------------------------
  // Task Modal Handlers
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

  function openCreateCategoryModal() {
    document.getElementById('category-id').value = '';
    document.getElementById('modal-category-title').textContent = 'Add Category';
    document.getElementById('category-name').value = '';
    document.getElementById('category-icon').value = 'folder';
    document.getElementById('category-color').value = '#ff3333';
    document.getElementById('btn-save-category').textContent = 'Create Category';
    modalManager.openModal(el.modalCategory);
  }

  function openEditCategoryModal(catId) {
    const cat = store.getState().categories.find(c => c.id == catId);
    if (!cat) return;

    document.getElementById('category-id').value = cat.id;
    document.getElementById('modal-category-title').textContent = 'Edit Category';
    document.getElementById('category-name').value = cat.name;
    document.getElementById('category-icon').value = cat.icon || 'folder';
    document.getElementById('category-color').value = cat.color || '#ff3333';
    document.getElementById('btn-save-category').textContent = 'Save Changes';
    modalManager.openModal(el.modalCategory);
  }

  function openProjectModal(categoryId) {
    document.getElementById('project-id').value = '';
    document.getElementById('project-category-id').value = categoryId;
    document.getElementById('modal-project-title').textContent = 'Add New Project / Class';
    document.getElementById('project-name').value = '';
    document.getElementById('project-desc').value = '';
    document.getElementById('project-color').value = '#ff3333';
    document.getElementById('btn-save-project').textContent = 'Create Project';
    modalManager.openModal(el.modalProject);
  }

  function openEditProjectModal(projId, categoryId) {
    let proj = null;
    store.getState().categories.forEach(c => {
      const p = (c.projects || []).find(pj => pj.id == projId);
      if (p) proj = p;
    });
    if (!proj) return;

    document.getElementById('project-id').value = proj.id;
    document.getElementById('project-category-id').value = categoryId || proj.category_id;
    document.getElementById('modal-project-title').textContent = 'Edit Project / Class';
    document.getElementById('project-name').value = proj.name;
    document.getElementById('project-desc').value = proj.description || '';
    document.getElementById('project-color').value = proj.color || '#ff3333';
    document.getElementById('btn-save-project').textContent = 'Save Changes';
    modalManager.openModal(el.modalProject);
  }

  function addSubtaskRow(title = '', completed = false) {
    const row = document.createElement('div');
    row.className = 'subtask-edit-row';
    row.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';
    row.innerHTML = `
      <input type="checkbox" class="subtask-edit-chk" ${completed ? 'checked' : ''}>
      <input type="text" class="subtask-edit-title" value="${escapeHtml(title)}" placeholder="Subtask item..." style="flex: 1;">
      <button type="button" class="icon-btn-sm btn-remove-subtask" title="Remove Subtask">
        <i data-lucide="x"></i>
      </button>
    `;
    row.querySelector('.btn-remove-subtask').addEventListener('click', () => row.remove());
    el.subtasksEditorList.appendChild(row);
    if (window.lucide) window.lucide.createIcons();
  }

  async function handleTaskFormSubmit(e) {
    e.preventDefault();

    const taskIdVal = el.taskId.value;
    const title = el.taskTitle.value.trim();
    const project_id = Number(el.taskProject.value);
    const priority = Number(el.taskPriority.value);
    const due_date = el.taskDueDate.value || null;
    const status = el.taskStatus.value;
    const reminder_frequency = el.taskReminder ? el.taskReminder.value : 'smart';
    const description = el.taskDesc.value;

    const subtasks = [];
    const rows = el.subtasksEditorList.querySelectorAll('.subtask-edit-row');
    rows.forEach((r, idx) => {
      const t = r.querySelector('.subtask-edit-title').value.trim();
      const c = r.querySelector('.subtask-edit-chk').checked ? 1 : 0;
      if (t) {
        subtasks.push({ title: t, completed: c, position: idx });
      }
    });

    const payload = {
      project_id,
      title,
      description,
      due_date,
      priority,
      status,
      reminder_frequency,
      subtasks
    };

    try {
      if (taskIdVal) {
        await apiService.updateTask(taskIdVal, payload);
        showToast('Task updated successfully');
      } else {
        await apiService.createTask(payload);
        showToast('Task created successfully');
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
    const projId = document.getElementById('project-id').value;
    const category_id = Number(document.getElementById('project-category-id').value);
    const name = document.getElementById('project-name').value.trim();
    const description = document.getElementById('project-desc').value.trim();
    const color = document.getElementById('project-color').value;

    try {
      if (projId) {
        await apiService.updateProject(projId, { name, description, color });
        showToast('Project updated');
      } else {
        await apiService.createProject({ category_id, name, description, color });
        showToast('Project created');
      }
      modalManager.closeModal(el.modalProject);
      await loadCategories();
    } catch (err) {
      showToast('Error saving project: ' + err.message);
    }
  }

  async function handleCategoryFormSubmit(e) {
    e.preventDefault();
    const catId = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value.trim();
    const icon = document.getElementById('category-icon').value;
    const color = document.getElementById('category-color').value;

    try {
      if (catId) {
        await apiService.updateCategory(catId, { name, icon, color });
        showToast('Category updated');
      } else {
        await apiService.createCategory({ name, icon, color });
        showToast('Category created');
      }
      modalManager.closeModal(el.modalCategory);
      await loadCategories();
    } catch (err) {
      showToast('Error saving category: ' + err.message);
    }
  }

  // ----------------------------------------------------
  // Import & Export Handlers
  // ----------------------------------------------------

  async function handleExportData() {
    try {
      showToast('Preparing backup export...');
      const data = await apiService.exportBackup();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SCJ28_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Backup downloaded successfully!');
    } catch (err) {
      showToast('Export failed: ' + err.message);
    }
  }

  function handleImportFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        pendingImportData = JSON.parse(event.target.result);
        const fileNameEl = document.getElementById('import-filename');
        const summaryEl = document.getElementById('import-summary');

        if (fileNameEl) fileNameEl.textContent = file.name;
        if (summaryEl) {
          const catsCount = (pendingImportData.categories || []).length;
          const projsCount = (pendingImportData.projects || []).length;
          const tasksCount = (pendingImportData.tasks || []).length;
          const subCount = (pendingImportData.subtasks || []).length;
          const diaryCount = (pendingImportData.diaries || []).length;

          summaryEl.innerHTML = `
            <strong>Backup Contents:</strong><br>
            • Categories: ${catsCount}<br>
            • Projects: ${projsCount}<br>
            • Tasks: ${tasksCount} (${subCount} subtasks)<br>
            • Diary Entries: ${diaryCount}
          `;
        }

        modalManager.openModal(el.modalImport);
      } catch (err) {
        showToast('Invalid JSON file format: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleConfirmImport() {
    if (!pendingImportData) return;

    const modeInput = document.querySelector('input[name="import-mode"]:checked');
    const mode = modeInput ? modeInput.value : 'replace';

    try {
      showToast('Importing data...');
      const res = await apiService.importBackup({ ...pendingImportData, mode });
      modalManager.closeModal(el.modalImport);
      pendingImportData = null;

      await loadSettings();
      await loadCategories();
      await loadTasks();
      await loadDiaries();
      await loadStats();

      showToast(`Import successful! Restored ${res.counts ? res.counts.tasks : 0} tasks and ${res.counts ? res.counts.diaries : 0} diaries.`);
    } catch (err) {
      showToast('Import failed: ' + err.message);
    }
  }

  async function openThemeModal() {
    const state = store.getState();
    const currentColor = (state.settings && state.settings.accentColor) || '#ff3333';

    const customColorInput = document.getElementById('input-custom-color');
    const customHexInput = document.getElementById('input-custom-hex');
    const presets = document.querySelectorAll('input[name="theme-preset"]');

    if (customColorInput) customColorInput.value = currentColor;
    if (customHexInput) customHexInput.value = currentColor;

    presets.forEach(p => {
      p.checked = p.value.toLowerCase() === currentColor.toLowerCase();
    });

    try {
      const ghStatus = await apiService.getGitHubStatus();
      const inputGhClientId = document.getElementById('input-gh-client-id');
      const inputGhSecret = document.getElementById('input-gh-client-secret');
      if (inputGhClientId && state.settings.github_client_id) {
        inputGhClientId.value = state.settings.github_client_id;
      }
      if (inputGhSecret && state.settings.github_client_secret) {
        inputGhSecret.value = state.settings.github_client_secret;
      }
    } catch (err) {
      console.error(err);
    }

    modalManager.openModal(document.getElementById('modal-theme'));
  }

  async function handleSaveTheme() {
    const customHexInput = document.getElementById('input-custom-hex');
    const colorVal = customHexInput ? customHexInput.value.trim() : '#ff3333';

    if (!/^#([0-9A-F]{3}){1,2}$/i.test(colorVal)) {
      showToast('Please enter a valid hexadecimal color (e.g. #ff3333)');
      return;
    }

    const inputGhClientId = document.getElementById('input-gh-client-id');
    const inputGhSecret = document.getElementById('input-gh-client-secret');
    const ghClientId = inputGhClientId ? inputGhClientId.value.trim() : '';
    const ghClientSecret = inputGhSecret ? inputGhSecret.value.trim() : '';

    try {
      applyAccentColor(colorVal);
      await apiService.updateSettings({ accentColor: colorVal });
      if (ghClientId || ghClientSecret) {
        await apiService.saveGitHubConfig({ client_id: ghClientId, client_secret: ghClientSecret });
      }
      store.setState({ settings: { ...store.getState().settings, accentColor: colorVal, github_client_id: ghClientId, github_client_secret: ghClientSecret } });
      modalManager.closeModal(document.getElementById('modal-theme'));
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast('Error saving settings: ' + err.message);
    }
  }

  // ----------------------------------------------------
  // GitHub Integration Handlers
  // ----------------------------------------------------

  const githubBoardHandlers = {
    onConnectRepo: (projectId) => openGitHubLinkModal(projectId),
    onOAuthLogin: () => openGitHubOAuthLogin(),
    onRefresh: (projectId) => loadGitHubBoard(projectId),
    onCreateIssue: (projectId) => openGitHubIssueModal(projectId),
    onImportTask: (projectId, issueData) => importGitHubIssueToTask(projectId, issueData),
    onOpenGuide: () => modalManager.openModal(document.getElementById('modal-github-guide'))
  };

  async function loadGitHubBoard(projectId) {
    if (!el.githubBoardContainer) return;
    if (!projectId) {
      renderGitHubBoard(el.githubBoardContainer, { configured: false, projectId: null }, githubBoardHandlers);
      return;
    }

    el.githubBoardContainer.innerHTML = `
      <div style="padding:40px;text-align:center;color:var(--text-muted);">
        <i data-lucide="loader-2" class="spin" style="width:32px;height:32px;margin-bottom:8px;"></i>
        <p>Fetching live GitHub Board...</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    try {
      const boardData = await apiService.getGitHubBoard(projectId);
      const authStatus = await apiService.getGitHubStatus();
      renderGitHubBoard(el.githubBoardContainer, { ...boardData, authStatus, projectId }, githubBoardHandlers);
    } catch (err) {
      el.githubBoardContainer.innerHTML = `
        <div class="empty-state" style="color:var(--accent-red);max-width:500px;margin:40px auto;text-align:center;">
          <i data-lucide="alert-circle" style="width:44px;height:44px;margin-bottom:12px;"></i>
          <h3>GitHub Board Notice</h3>
          <p style="margin-bottom:16px;">${escapeHtml(err.message)}</p>
          <button class="btn btn-secondary btn-sm" id="btn-retry-gh-board">Retry</button>
        </div>
      `;
      const btnRetry = el.githubBoardContainer.querySelector('#btn-retry-gh-board');
      if (btnRetry) btnRetry.addEventListener('click', () => loadGitHubBoard(projectId));
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function openGitHubLinkModal(projectId) {
    const modalLink = document.getElementById('modal-github-link');
    const inputProjId = document.getElementById('gh-link-project-id');
    const inputRepo = document.getElementById('gh-link-repo');
    const inputBoardId = document.getElementById('gh-link-project-id-input');

    if (!modalLink) return;

    let targetProj = null;
    store.getState().categories.forEach(c => {
      const p = (c.projects || []).find(pj => pj.id == projectId);
      if (p) targetProj = p;
    });

    if (inputProjId) inputProjId.value = projectId || '';
    if (inputRepo) inputRepo.value = targetProj ? (targetProj.github_repo || '') : '';
    if (inputBoardId) inputBoardId.value = targetProj ? (targetProj.github_project_id || '') : '';

    modalManager.openModal(modalLink);
  }

  async function handleGitHubLinkSubmit(e) {
    e.preventDefault();
    const projectId = document.getElementById('gh-link-project-id').value;
    const github_repo = document.getElementById('gh-link-repo').value.trim();
    const github_project_id = document.getElementById('gh-link-project-id-input').value.trim();

    if (!github_repo) {
      showToast('Please enter a valid GitHub repository (owner/repo)');
      return;
    }

    try {
      await apiService.updateProject(projectId, { github_repo, github_project_id });
      modalManager.closeModal(document.getElementById('modal-github-link'));
      showToast('GitHub repository connection saved!');
      await loadCategories();
      loadGitHubBoard(projectId);
    } catch (err) {
      showToast('Failed to save connection: ' + err.message);
    }
  }

  async function openGitHubOAuthLogin() {
    try {
      const data = await apiService.getGitHubAuthUrl();
      if (data && data.url) {
        window.open(data.url, 'GitHub OAuth Authorization', 'width=600,height=700');
      }
    } catch (err) {
      showToast('OAuth Error: ' + err.message);
    }
  }

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GITHUB_AUTH_SUCCESS') {
      showToast('GitHub account connected successfully!');
      const activeProj = store.getState().activeProject;
      if (activeProj) loadGitHubBoard(activeProj);
    }
  });

  function openGitHubIssueModal(projectId) {
    const modalIssue = document.getElementById('modal-github-issue');
    const formIssue = document.getElementById('form-github-issue');
    if (!modalIssue) return;
    if (formIssue) formIssue.reset();
    modalManager.openModal(modalIssue);
  }

  async function handleGitHubIssueSubmit(e) {
    e.preventDefault();
    const projectId = store.getState().activeProject;
    const title = document.getElementById('gh-issue-title').value.trim();
    const body = document.getElementById('gh-issue-body').value.trim();
    const labelsRaw = document.getElementById('gh-issue-labels').value.trim();
    const labels = labelsRaw ? labelsRaw.split(',').map(l => l.trim()).filter(Boolean) : [];

    if (!title) {
      showToast('Issue title is required');
      return;
    }

    try {
      showToast('Creating GitHub Issue...');
      await apiService.createGitHubIssue(projectId, { title, body, labels });
      modalManager.closeModal(document.getElementById('modal-github-issue'));
      showToast('GitHub Issue created successfully!');
      loadGitHubBoard(projectId);
    } catch (err) {
      showToast('Error creating issue: ' + err.message);
    }
  }

  async function importGitHubIssueToTask(projectId, issueData) {
    try {
      showToast(`Importing #${issueData.number} into SCJ28 Tasks...`);
      await apiService.importGitHubTask(projectId, issueData);
      showToast(`Task [#${issueData.number}] imported successfully!`);
      await loadTasks();
      await loadStats();
      loadGitHubBoard(projectId);
    } catch (err) {
      showToast('Error importing task: ' + err.message);
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

    // Content Sub-tabs (Tasks | Diaries | GitHub Board) switching
    if (el.contentSubtabs) {
      el.contentSubtabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.subtab-btn');
        if (!btn) return;
        const tab = btn.dataset.tab;
        store.setState({ activeTab: tab });
        if (tab === 'diaries') loadDiaries();
        else if (tab === 'github') loadGitHubBoard(store.getState().activeProject);
        else loadTasks();
      });
    }

    // View mode toggles
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');

        const currentView = targetBtn.dataset.view;
        store.setState({ currentView, activeTab: 'tasks' });

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
        if (activeFilter === 'diaries') {
          store.setState({ activeFilter: 'diaries', activeCategory: null, activeProject: null, activeTab: 'diaries' });
          el.viewTitle.textContent = 'All Diaries';
          el.viewSubtitle.textContent = 'Overview of all diary entries across projects';
          loadDiaries();
        } else {
          store.setState({ activeFilter, activeCategory: null, activeProject: null, activeTab: 'tasks' });
          el.viewTitle.textContent = item.querySelector('span').textContent;
          el.viewSubtitle.textContent = `Filtered view: ${activeFilter}`;
          loadTasks();
        }
      });
    });

    // Category tree clicks (delegation for select, edit, delete)
    el.categoriesTree.addEventListener('click', (e) => {
      const catHeader = e.target.closest('.category-header');
      const projItem = e.target.closest('.project-item');
      const btnAddProj = e.target.closest('.btn-add-proj');
      const btnEditCat = e.target.closest('.btn-edit-cat');
      const btnDeleteCat = e.target.closest('.btn-delete-cat');
      const btnEditProj = e.target.closest('.btn-edit-proj');
      const btnDeleteProj = e.target.closest('.btn-delete-proj');

      if (btnAddProj) {
        e.stopPropagation();
        openProjectModal(btnAddProj.dataset.catId);
        return;
      }

      if (btnEditCat) {
        e.stopPropagation();
        openEditCategoryModal(btnEditCat.dataset.catId);
        return;
      }

      if (btnDeleteCat) {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this category? All its projects, tasks, and diaries will also be deleted.')) {
          deleteCategory(btnDeleteCat.dataset.catId);
        }
        return;
      }

      if (btnEditProj) {
        e.stopPropagation();
        openEditProjectModal(btnEditProj.dataset.projId, btnEditProj.dataset.catId);
        return;
      }

      if (btnDeleteProj) {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project? All its tasks and diaries will also be deleted.')) {
          deleteProject(btnDeleteProj.dataset.projId);
        }
        return;
      }

      if (catHeader) {
        document.querySelectorAll('.nav-item, .category-header, .project-item').forEach(i => i.classList.remove('active'));
        catHeader.classList.add('active');

        const catId = Number(catHeader.dataset.catId);
        store.setState({ activeCategory: catId, activeProject: null, activeFilter: 'all' });

        const catObj = store.getState().categories.find(c => c.id === catId);
        el.viewTitle.textContent = catObj ? catObj.name : 'Category Tasks';
        el.viewSubtitle.textContent = 'All tasks & diaries under this category';

        loadTasks();
        loadDiaries();
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
        el.viewSubtitle.textContent = 'Project specific tasks and diaries';

        loadTasks();
        loadDiaries();
      }
    });

    // Theme Color Picker Event Listeners
    if (el.btnThemeSettings) {
      el.btnThemeSettings.addEventListener('click', openThemeModal);
    }

    const btnSaveTheme = document.getElementById('btn-save-theme');
    if (btnSaveTheme) {
      btnSaveTheme.addEventListener('click', handleSaveTheme);
    }

    const customColorInput = document.getElementById('input-custom-color');
    const customHexInput = document.getElementById('input-custom-hex');
    const presets = document.querySelectorAll('input[name="theme-preset"]');

    if (customColorInput && customHexInput) {
      customColorInput.addEventListener('input', (e) => {
        customHexInput.value = e.target.value;
        presets.forEach(p => { p.checked = false; });
      });

      customHexInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
          customColorInput.value = val;
        }
        presets.forEach(p => { p.checked = p.value.toLowerCase() === val.toLowerCase(); });
      });

      presets.forEach(p => {
        p.addEventListener('change', (e) => {
          if (e.target.checked) {
            customColorInput.value = e.target.value;
            customHexInput.value = e.target.value;
          }
        });
      });
    }

    // Opacity & Background Image Event Listeners
    const inputOpacity = document.getElementById('input-bkg-opacity');
    if (inputOpacity) {
      inputOpacity.addEventListener('input', (e) => {
        applyPanelOpacity(e.target.value);
      });
    }

    const btnSelectBkg = document.getElementById('btn-select-bkg');
    const inputBkgFile = document.getElementById('input-bkg-file');
    const btnRemoveBkg = document.getElementById('btn-remove-bkg');

    if (btnSelectBkg && inputBkgFile) {
      btnSelectBkg.addEventListener('click', () => inputBkgFile.click());
      inputBkgFile.addEventListener('change', handleBkgFileSelect);
    }
    if (btnRemoveBkg) {
      btnRemoveBkg.addEventListener('click', handleRemoveBkg);
    }

    // Search box debounce
    let searchDebounce;
    el.inputSearch.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        store.setState({ searchQuery: e.target.value.trim() });
        loadTasks();
      }, 250);
    });

    if (el.inputDiarySearch) {
      let diarySearchDebounce;
      el.inputDiarySearch.addEventListener('input', (e) => {
        clearTimeout(diarySearchDebounce);
        diarySearchDebounce = setTimeout(() => {
          store.setState({ searchQuery: e.target.value.trim() });
          loadDiaries();
        }, 250);
      });
    }

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

    // Diaries list delegation clicks
    if (el.diariesListContainer) {
      el.diariesListContainer.addEventListener('click', async (e) => {
        const btnEdit = e.target.closest('.btn-edit-diary');
        const btnDel = e.target.closest('.btn-delete-diary');

        if (btnEdit) openEditDiaryModal(btnEdit.dataset.diaryId);
        if (btnDel) {
          if (confirm('Are you sure you want to delete this diary entry?')) {
            await deleteDiary(btnDel.dataset.diaryId);
          }
        }
      });
    }

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
    document.getElementById('btn-add-category').addEventListener('click', () => openCreateCategoryModal());
    if (el.btnNewDiary) el.btnNewDiary.addEventListener('click', openCreateDiaryModal);

    // Write / Preview Tabs in Diary Modal
    if (el.tabEditorWrite && el.tabEditorPreview) {
      el.tabEditorWrite.addEventListener('click', () => {
        el.tabEditorWrite.classList.add('active');
        el.tabEditorPreview.classList.remove('active');
        el.editorPaneWrite.style.display = 'block';
        el.editorPanePreview.style.display = 'none';
      });

      el.tabEditorPreview.addEventListener('click', () => {
        el.tabEditorPreview.classList.add('active');
        el.tabEditorWrite.classList.remove('active');
        el.editorPaneWrite.style.display = 'none';
        el.editorPanePreview.style.display = 'block';

        const rawText = el.diaryContent.value;
        if (rawText) {
          el.editorPanePreview.className = 'markdown-preview-box markdown-rendered-content';
          el.editorPanePreview.innerHTML = parseMarkdown(rawText);
        } else {
          el.editorPanePreview.textContent = 'Nothing to preview.';
        }
      });
    }

    // Paste image event in diary textarea
    if (el.diaryContent) {
      el.diaryContent.addEventListener('paste', handleDiaryContentPaste);
    }

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
    if (el.formDiary) el.formDiary.addEventListener('submit', handleDiaryFormSubmit);

    const formGhLink = document.getElementById('form-github-link');
    if (formGhLink) formGhLink.addEventListener('submit', handleGitHubLinkSubmit);

    const formGhIssue = document.getElementById('form-github-issue');
    if (formGhIssue) formGhIssue.addEventListener('submit', handleGitHubIssueSubmit);

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
