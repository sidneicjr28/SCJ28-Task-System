// Tasks List View Component Renderer (Single Responsibility Principle)
import { escapeHtml } from '../ui/toast.js';

export function renderTasksList(container, tasks) {
  if (!container) return;
  container.innerHTML = '';

  if (tasks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px; color: var(--text-muted);">
        <i data-lucide="check-circle" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 12px;"></i>
        <p style="font-size: 1.1rem; font-weight: 600;">No tasks found</p>
        <p style="font-size: 0.85rem;">Create a new task to get started!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tasks.forEach(task => {
    const isDone = task.status === 'done';
    const card = document.createElement('div');
    card.className = `task-card priority-${task.priority} ${isDone ? 'done' : ''}`;

    const completedSubtasks = (task.subtasks || []).filter(st => st.completed).length;
    const totalSubtasks = (task.subtasks || []).length;
    const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    let dueHtml = '';
    if (task.due_date) {
      const d = new Date(task.due_date);
      const isOverdue = d < new Date() && !isDone;
      const formattedDate = d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      dueHtml = `
        <div class="meta-item ${isOverdue ? 'due-overdue' : ''}">
          <i data-lucide="clock"></i>
          <span>${formattedDate} ${isOverdue ? '(Overdue)' : ''}</span>
        </div>
      `;
    }

    const pText = task.priority === 1 ? 'P1 Urgent' : task.priority === 2 ? 'P2 High' : task.priority === 3 ? 'P3 Medium' : 'P4 Low';

    const subtasksSummary = totalSubtasks > 0 ? `
      <span class="meta-item"><i data-lucide="check-square"></i> ${completedSubtasks}/${totalSubtasks}</span>
    ` : '';

    const hasDetails = (task.description && task.description.trim()) || totalSubtasks > 0;

    card.innerHTML = `
      <div class="task-header">
        <div class="task-checkbox ${isDone ? 'checked' : ''}" data-task-id="${task.id}" data-current-status="${task.status}">
          ${isDone ? '<i data-lucide="check" style="width:14px; height:14px; color:#fff;"></i>' : ''}
        </div>
        <div class="task-title-wrap">
          <div class="task-title">${escapeHtml(task.title)}</div>
        </div>
        <div class="task-actions">
          <button class="icon-btn-sm btn-edit-task" data-task-id="${task.id}" title="Edit Task">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="icon-btn-sm btn-delete-task" data-task-id="${task.id}" title="Delete Task">
            <i data-lucide="trash-2"></i>
          </button>
          ${hasDetails ? `
            <button class="icon-btn-sm btn-toggle-expand" title="Expand / Collapse Task">
              <i data-lucide="chevron-down" class="chevron-icon"></i>
            </button>
          ` : ''}
        </div>
      </div>

      <div class="task-meta">
        <span class="p-badge p-badge-${task.priority}">${pText}</span>
        <span class="project-tag" style="border-left: 3px solid ${task.project_color || '#ff3333'};">
          ${escapeHtml(task.category_name)} / ${escapeHtml(task.project_name)}
        </span>
        ${dueHtml}
        ${subtasksSummary}
      </div>

      ${hasDetails ? `
        <div class="task-card-details">
          ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
          ${totalSubtasks > 0 ? `
            <div class="subtasks-progress" style="margin-top: 10px;">
              <span>Progress: ${completedSubtasks}/${totalSubtasks} (${subtaskPercent}%)</span>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${subtaskPercent}%"></div>
              </div>
            </div>
            <div class="subtasks-list-inline" style="margin-top: 6px;">
              ${task.subtasks.map(st => `
                <div class="subtask-item-inline ${st.completed ? 'done' : ''}">
                  <input type="checkbox" class="chk-subtask" data-sub-id="${st.id}" ${st.completed ? 'checked' : ''}>
                  <span>${escapeHtml(st.title)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;

    // Only header or meta click toggles expansion (and text selection does not collapse)
    if (hasDetails) {
      const toggleExpand = (e) => {
        if (e.target.closest('.task-checkbox') || e.target.closest('.btn-edit-task') || e.target.closest('.btn-delete-task')) {
          return;
        }
        if (window.getSelection && window.getSelection().toString().length > 0) {
          return;
        }
        card.classList.toggle('expanded');
      };

      const headerEl = card.querySelector('.task-header');
      const metaEl = card.querySelector('.task-meta');
      if (headerEl) headerEl.addEventListener('click', toggleExpand);
      if (metaEl) metaEl.addEventListener('click', toggleExpand);
    }

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}
