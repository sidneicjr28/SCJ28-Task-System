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
        <button class="icon-btn-sm btn-add-proj" data-cat-id="${cat.id}" title="Add Project to ${escapeHtml(cat.name)}">
          <i data-lucide="plus"></i>
        </button>
      </div>
      <ul class="project-list">
        ${(cat.projects || []).map(p => `
          <li class="project-item ${state.activeProject === p.id ? 'active' : ''}" data-proj-id="${p.id}">
            <span class="project-dot" style="background-color: ${p.color || '#ff3333'}"></span>
            <span>${escapeHtml(p.name)}</span>
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
