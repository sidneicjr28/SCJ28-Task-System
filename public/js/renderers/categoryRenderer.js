// Category Tree Component Renderer (Single Responsibility Principle)
import { escapeHtml } from '../ui/toast.js';

export function renderCategoriesTree(container, categories, state) {
  if (!container) return;
  container.innerHTML = '';

  categories.forEach(cat => {
    const group = document.createElement('div');
    group.className = 'category-group';

    const iconName = cat.icon === 'graduation-cap' ? 'graduation-cap' :
                     cat.icon === 'briefcase' ? 'briefcase' :
                     cat.icon === 'user' ? 'user' :
                     cat.icon === 'rocket' ? 'rocket' :
                     cat.icon === 'code' ? 'code' : 'folder';

    const isActiveCat = state.activeCategory === cat.id && !state.activeProject;

    group.innerHTML = `
      <div class="category-header ${isActiveCat ? 'active' : ''}" data-cat-id="${cat.id}">
        <div class="cat-title-wrap">
          <i data-lucide="${iconName}"></i>
          <span>${escapeHtml(cat.name)}</span>
        </div>
        <div class="cat-actions">
          <button class="icon-btn-sm btn-add-proj" data-cat-id="${cat.id}" title="Add Project to ${escapeHtml(cat.name)}">
            <i data-lucide="plus"></i>
          </button>
          <button class="icon-btn-sm btn-edit-cat" data-cat-id="${cat.id}" title="Edit Category">
            <i data-lucide="pencil"></i>
          </button>
          <button class="icon-btn-sm btn-delete-cat" data-cat-id="${cat.id}" title="Delete Category">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
      <ul class="project-list">
        ${(cat.projects || []).map(p => `
          <li class="project-item ${state.activeProject === p.id ? 'active' : ''}" data-proj-id="${p.id}">
            <div class="proj-title-wrap">
              <span class="project-dot" style="background-color: ${p.color || '#ff3333'}"></span>
              <span>${escapeHtml(p.name)}</span>
            </div>
            <div class="proj-actions">
              <button class="icon-btn-sm btn-edit-proj" data-proj-id="${p.id}" data-cat-id="${cat.id}" title="Edit Project">
                <i data-lucide="pencil"></i>
              </button>
              <button class="icon-btn-sm btn-delete-proj" data-proj-id="${p.id}" title="Delete Project">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </li>
        `).join('')}
      </ul>
    `;

    container.appendChild(group);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

export function renderProjectSelectOptions(selectElement, categories) {
  if (!selectElement) return;
  selectElement.innerHTML = '';

  categories.forEach(cat => {
    const optGroup = document.createElement('optgroup');
    optGroup.label = cat.name;
    (cat.projects || []).forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = p.name;
      optGroup.appendChild(option);
    });
    selectElement.appendChild(optGroup);
  });
}
