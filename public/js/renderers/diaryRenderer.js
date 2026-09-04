import { escapeHtml } from '../ui/toast.js';

export function parseMarkdown(content) {
  if (!content) return '';
  // Normalize standalone checklist syntax like "[ ] Item" or "[x] Item" to "- [ ] Item"
  let formatted = content.replace(/^(\s*)\[([\s xX])\]\s+/gm, '$1- [$2] ');

  if (window.marked) {
    try {
      if (typeof window.marked.use === 'function') {
        window.marked.use({ gfm: true, breaks: true });
      }
      return window.marked.parse(formatted, { gfm: true, breaks: true });
    } catch (e) {
      return escapeHtml(content).replace(/\n/g, '<br>');
    }
  }
  return escapeHtml(content).replace(/\n/g, '<br>');
}

export function renderDiariesList(container, diaries) {
  if (!container) return;
  container.innerHTML = '';

  if (!diaries || diaries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="book-open" class="empty-icon"></i>
        <h3>No Diary Entries Found</h3>
        <p>Start documenting course notes, project logs, or thoughts by creating a new diary entry!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const list = document.createElement('div');
  list.className = 'diary-cards-grid';

  diaries.forEach(diary => {
    const card = document.createElement('div');
    card.className = 'diary-card';
    card.setAttribute('data-diary-id', diary.id);

    const formattedDate = new Date(diary.updated_at || diary.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const renderedContent = parseMarkdown(diary.content || '');

    // Clean plain text snippet for compact preview
    const plainSnippet = diary.content ? diary.content.replace(/!\[.*?\]\(.*?\)/g, '').replace(/[#*`_~]/g, '').trim() : '';
    const previewText = plainSnippet ? (plainSnippet.length > 100 ? plainSnippet.slice(0, 100) + '...' : plainSnippet) : 'Click to view full entry...';

    const projBadge = diary.project_name ? `
      <span class="diary-proj-badge" style="border-left: 3px solid ${diary.project_color || '#ff3333'};">
        ${escapeHtml(diary.project_name)}
      </span>
    ` : diary.category_name ? `
      <span class="diary-proj-badge">
        ${escapeHtml(diary.category_name)}
      </span>
    ` : '';

    const linkedCount = (diary.attached_tasks || []).length;
    const linkedPill = linkedCount > 0 ? `
      <span class="meta-item"><i data-lucide="paperclip"></i> ${linkedCount} task${linkedCount > 1 ? 's' : ''}</span>
    ` : '';

    const attachedTasksHtml = (diary.attached_tasks && diary.attached_tasks.length > 0) ? `
      <div class="diary-attached-tasks">
        <span class="attached-label"><i data-lucide="paperclip"></i> Linked Tasks (${diary.attached_tasks.length}):</span>
        <div class="attached-pills">
          ${diary.attached_tasks.map(t => `
            <span class="task-pill ${t.status === 'done' ? 'completed' : ''}">
              <i data-lucide="${t.status === 'done' ? 'check-circle-2' : 'circle'}"></i>
              ${escapeHtml(t.title)}
            </span>
          `).join('')}
        </div>
      </div>
    ` : '';

    card.innerHTML = `
      <div class="diary-card-header">
        <div class="diary-title-group">
          <h3 class="diary-title">${escapeHtml(diary.title)}</h3>
          <div class="diary-meta">
            ${projBadge}
            <span class="diary-date"><i data-lucide="clock"></i> ${formattedDate}</span>
            ${linkedPill}
          </div>
          <span class="diary-snippet-preview">${escapeHtml(previewText)}</span>
        </div>
        <div class="diary-actions">
          <button class="icon-btn-sm btn-edit-diary" data-diary-id="${diary.id}" title="Edit Diary">
            <i data-lucide="pencil"></i>
          </button>
          <button class="icon-btn-sm btn-delete-diary" data-diary-id="${diary.id}" title="Delete Diary">
            <i data-lucide="trash-2"></i>
          </button>
          <button class="icon-btn-sm btn-toggle-expand" title="Expand / Collapse Entry">
            <i data-lucide="chevron-down" class="chevron-icon"></i>
          </button>
        </div>
      </div>

      <div class="diary-card-details">
        <div class="diary-card-body markdown-rendered-content">
          ${renderedContent}
        </div>
        ${attachedTasksHtml}
      </div>
    `;

    // Only header click toggles expansion (and text selection inside header does not collapse)
    const headerEl = card.querySelector('.diary-card-header');
    if (headerEl) {
      headerEl.addEventListener('click', (e) => {
        if (e.target.closest('.btn-edit-diary') || e.target.closest('.btn-delete-diary')) {
          return;
        }
        if (window.getSelection && window.getSelection().toString().length > 0) {
          return;
        }
        card.classList.toggle('expanded');
      });
    }

    list.appendChild(card);
  });

  container.appendChild(list);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
