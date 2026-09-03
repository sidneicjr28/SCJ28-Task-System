// Kanban Board View Component Renderer & Drag-Drop Handler (Single Responsibility Principle)
import { escapeHtml } from '../ui/toast.js';

export function renderKanbanBoard(elements, tasks, onStatusChange) {
  const { kbCardsTodo, kbCardsInProgress, kbCardsDone, kbCountTodo, kbCountInProgress, kbCountDone } = elements;

  if (!kbCardsTodo || !kbCardsInProgress || !kbCardsDone) return;

  kbCardsTodo.innerHTML = '';
  kbCardsInProgress.innerHTML = '';
  kbCardsDone.innerHTML = '';

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  if (kbCountTodo) kbCountTodo.textContent = todoTasks.length;
  if (kbCountInProgress) kbCountInProgress.textContent = inProgressTasks.length;
  if (kbCountDone) kbCountDone.textContent = doneTasks.length;

  const renderColumnCards = (container, taskList) => {
    taskList.forEach(task => {
      const card = document.createElement('div');
      card.className = `kanban-card priority-${task.priority}`;
      card.draggable = true;
      card.dataset.taskId = task.id;

      const pText = task.priority === 1 ? 'P1' : task.priority === 2 ? 'P2' : task.priority === 3 ? 'P3' : 'P4';

      card.innerHTML = `
        <div style="display:flex; justify-space-between; align-items:center;">
          <span class="p-badge p-badge-${task.priority}">${pText}</span>
          <span class="project-tag" style="font-size:0.7rem;">${escapeHtml(task.project_name)}</span>
        </div>
        <div style="font-weight:600; font-size:0.9rem;">${escapeHtml(task.title)}</div>
        ${task.due_date ? `<div style="font-size:0.75rem; color:var(--text-muted);"><i data-lucide="clock" style="width:12px;height:12px;"></i> ${new Date(task.due_date).toLocaleDateString()}</div>` : ''}
        <div style="display:flex; justify-content:flex-end; gap:4px; margin-top:4px;">
          <button class="icon-btn-sm btn-edit-task" data-task-id="${task.id}"><i data-lucide="edit-2"></i></button>
          <button class="icon-btn-sm btn-delete-task" data-task-id="${task.id}"><i data-lucide="trash-2"></i></button>
        </div>
      `;

      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
      });

      container.appendChild(card);
    });
  };

  renderColumnCards(kbCardsTodo, todoTasks);
  renderColumnCards(kbCardsInProgress, inProgressTasks);
  renderColumnCards(kbCardsDone, doneTasks);

  setupKanbanDropZones([kbCardsTodo, kbCardsInProgress, kbCardsDone], onStatusChange);

  if (window.lucide) window.lucide.createIcons();
}

function setupKanbanDropZones(zones, onStatusChange) {
  zones.forEach(zone => {
    const col = zone.closest('.kanban-column');
    if (!col) return;
    const targetStatus = col.dataset.status;

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.style.backgroundColor = 'rgba(255, 51, 51, 0.05)';
    });

    zone.addEventListener('dragleave', () => {
      zone.style.backgroundColor = 'transparent';
    });

    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.style.backgroundColor = 'transparent';
      const taskId = e.dataTransfer.getData('text/plain');
      if (taskId && onStatusChange) {
        onStatusChange(taskId, targetStatus);
      }
    });
  });
}
