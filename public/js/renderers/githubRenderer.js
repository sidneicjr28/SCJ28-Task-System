import { escapeHtml } from '../ui/toast.js';

export function renderGitHubBoard(container, data, handlers = {}) {
  if (!container) return;

  const { onConnectRepo, onOAuthLogin, onDisconnect, onRefresh, onCreateIssue, onImportTask, onOpenGuide } = handlers;
  const authStatus = (data && data.authStatus) || {};
  const isAuth = !!(authStatus.connected && authStatus.user);

  // Case 1: No specific project selected
  if (!data || !data.projectId) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="github" style="width:48px;height:48px;color:var(--text-muted);margin-bottom:12px;"></i>
        <h3>Select a Project</h3>
        <p>Please select a specific project from the sidebar to view or connect its GitHub Board.</p>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:16px;flex-wrap:wrap;">
          ${!isAuth ? `
            <button class="btn btn-primary btn-sm" id="btn-gh-oauth-login-empty">
              <i data-lucide="github"></i> Login with GitHub
            </button>
          ` : `
            <div class="gh-user-badge" title="Connected as ${escapeHtml(authStatus.user.login)}">
              <img src="${authStatus.user.avatar_url}" alt="${escapeHtml(authStatus.user.login)}" class="gh-avatar-sm">
              <span>Connected as ${escapeHtml(authStatus.user.login)}</span>
              ${onDisconnect ? `
                <button type="button" class="btn-gh-logout" id="btn-gh-logout-empty" title="Disconnect GitHub Account" style="background:none;border:none;color:var(--text-muted);cursor:pointer;margin-left:6px;padding:2px;display:inline-flex;align-items:center;">
                  <i data-lucide="log-out" style="width:13px;height:13px;"></i>
                </button>
              ` : ''}
            </div>
          `}
          <button class="btn btn-secondary btn-sm" id="btn-gh-open-guide-empty">
            <i data-lucide="help-circle"></i> Setup Guide
          </button>
        </div>
      </div>
    `;
    const btnLogin = container.querySelector('#btn-gh-oauth-login-empty');
    if (btnLogin && onOAuthLogin) btnLogin.addEventListener('click', onOAuthLogin);
    const btnLogout = container.querySelector('#btn-gh-logout-empty');
    if (btnLogout && onDisconnect) btnLogout.addEventListener('click', onDisconnect);
    const btnGuide = container.querySelector('#btn-gh-open-guide-empty');
    if (btnGuide && onOpenGuide) btnGuide.addEventListener('click', onOpenGuide);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Case 2: Project selected, but no GitHub repository linked
  if (!data.configured) {
    container.innerHTML = `
      <div class="empty-state" style="max-width:540px;margin:40px auto;text-align:center;">
        <i data-lucide="github" style="width:56px;height:56px;color:var(--accent-red);margin-bottom:16px;"></i>
        <h3>Connect GitHub Repository</h3>
        <p style="color:var(--text-muted);margin-bottom:20px;line-height:1.5;">
          Link this project to a GitHub repository (e.g. <code>owner/repository</code>) to view live Kanban issues, create cards, and import tasks.
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" id="btn-gh-connect-repo">
            <i data-lucide="link"></i> Link GitHub Repo
          </button>
          ${!isAuth ? `
            <button class="btn btn-secondary" id="btn-gh-oauth-login-unconfig">
              <i data-lucide="github"></i> Login with GitHub
            </button>
          ` : `
            <div class="gh-user-badge" title="Connected as ${escapeHtml(authStatus.user.login)}">
              <img src="${authStatus.user.avatar_url}" alt="${escapeHtml(authStatus.user.login)}" class="gh-avatar-sm">
              <span>Connected as ${escapeHtml(authStatus.user.login)}</span>
              ${onDisconnect ? `
                <button type="button" class="btn-gh-logout" id="btn-gh-logout-unconfig" title="Disconnect GitHub Account" style="background:none;border:none;color:var(--text-muted);cursor:pointer;margin-left:6px;padding:2px;display:inline-flex;align-items:center;">
                  <i data-lucide="log-out" style="width:13px;height:13px;"></i>
                </button>
              ` : ''}
            </div>
          `}
          <button class="btn btn-secondary" id="btn-gh-open-guide-unconfig">
            <i data-lucide="help-circle"></i> Setup Guide
          </button>
        </div>
      </div>
    `;

    const btnConnect = container.querySelector('#btn-gh-connect-repo');
    if (btnConnect && onConnectRepo) {
      btnConnect.addEventListener('click', () => onConnectRepo(data.projectId));
    }
    const btnLogin = container.querySelector('#btn-gh-oauth-login-unconfig');
    if (btnLogin && onOAuthLogin) {
      btnLogin.addEventListener('click', onOAuthLogin);
    }
    const btnLogout = container.querySelector('#btn-gh-logout-unconfig');
    if (btnLogout && onDisconnect) {
      btnLogout.addEventListener('click', onDisconnect);
    }
    const btnGuide = container.querySelector('#btn-gh-open-guide-unconfig');
    if (btnGuide && onOpenGuide) {
      btnGuide.addEventListener('click', onOpenGuide);
    }

    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Case 3: Project configured with GitHub Repository
  const { repo, issues = [] } = data;

  const todoIssues = issues.filter(i => i.status === 'todo');
  const inProgressIssues = issues.filter(i => i.status === 'in_progress');
  const doneIssues = issues.filter(i => i.status === 'done');

  container.innerHTML = `
    <!-- Top Header Bar -->
    <div class="github-board-header">
      <div class="gh-header-left">
        <i data-lucide="github" style="width:22px;height:22px;color:var(--text-primary);"></i>
        <a href="https://github.com/${escapeHtml(repo)}" target="_blank" rel="noopener" class="gh-repo-link">
          ${escapeHtml(repo)}
          <i data-lucide="external-link" style="width:14px;height:14px;margin-left:4px;"></i>
        </a>
      </div>

      <div class="gh-header-actions">
        ${isAuth ? `
          <div class="gh-user-badge" title="Connected as ${escapeHtml(authStatus.user.login)}">
            <img src="${authStatus.user.avatar_url}" alt="${escapeHtml(authStatus.user.login)}" class="gh-avatar-sm">
            <span>${escapeHtml(authStatus.user.login)}</span>
            ${onDisconnect ? `
              <button type="button" class="btn-gh-logout" id="btn-gh-logout" title="Disconnect GitHub Account" style="background:none;border:none;color:var(--text-muted);cursor:pointer;margin-left:6px;padding:2px;display:inline-flex;align-items:center;">
                <i data-lucide="log-out" style="width:13px;height:13px;"></i>
              </button>
            ` : ''}
          </div>
        ` : `
          <button class="btn btn-primary btn-sm" id="btn-gh-oauth-login" title="Login with GitHub via OAuth">
            <i data-lucide="github"></i> Login with GitHub
          </button>
        `}

        <button class="btn btn-secondary icon-btn-sm" id="btn-gh-guide-header" title="How to Setup GitHub OAuth">
          <i data-lucide="help-circle"></i>
        </button>

        <button class="btn btn-secondary icon-btn-sm" id="btn-gh-refresh" title="Refresh Board Data">
          <i data-lucide="refresh-cw"></i>
        </button>

        <button class="btn btn-secondary icon-btn-sm" id="btn-gh-settings" title="Edit GitHub Repository Link">
          <i data-lucide="settings"></i>
        </button>

        <button class="btn btn-primary btn-sm" id="btn-gh-create-issue">
          <i data-lucide="plus"></i> New Issue
        </button>
      </div>
    </div>

    ${!isAuth ? `
      <!-- Unauthenticated Notice Banner -->
      <div class="gh-auth-banner" style="background: rgba(255, 51, 51, 0.08); border: 1px solid rgba(255, 51, 51, 0.25); border-radius: var(--radius-md); padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; font-size: 0.88rem; color: var(--text-main);">
          <i data-lucide="shield-alert" style="color: var(--accent-red); width: 18px; height: 18px; flex-shrink: 0;"></i>
          <span>You are currently not logged in with GitHub. Log in to sync private repositories, create issues, and save your login session automatically.</span>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-gh-banner-login">
          <i data-lucide="github"></i> Login with GitHub
        </button>
      </div>
    ` : ''}

    <!-- Live GitHub Kanban Board -->
    <div class="kanban-board">
      <!-- Column: To Do -->
      <div class="kanban-column" data-gh-status="todo">
        <div class="kanban-header">
          <span class="kanban-title"><i data-lucide="circle"></i> To Do / Open</span>
          <span class="kanban-count">${todoIssues.length}</span>
        </div>
        <div class="kanban-cards" id="gh-cards-todo"></div>
      </div>

      <!-- Column: In Progress -->
      <div class="kanban-column" data-gh-status="in_progress">
        <div class="kanban-header">
          <span class="kanban-title"><i data-lucide="clock"></i> Assigned / In Progress</span>
          <span class="kanban-count">${inProgressIssues.length}</span>
        </div>
        <div class="kanban-cards" id="gh-cards-in-progress"></div>
      </div>

      <!-- Column: Done -->
      <div class="kanban-column" data-gh-status="done">
        <div class="kanban-header">
          <span class="kanban-title"><i data-lucide="check-circle-2"></i> Closed / Done</span>
          <span class="kanban-count">${doneIssues.length}</span>
        </div>
        <div class="kanban-cards" id="gh-cards-done"></div>
      </div>
    </div>
  `;

  // Helper to render issue cards
  const renderCards = (targetContainer, issueList) => {
    if (!targetContainer) return;
    if (issueList.length === 0) {
      targetContainer.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.8rem;">No items</div>`;
      return;
    }

    issueList.forEach(issue => {
      const card = document.createElement('div');
      card.className = `kanban-card gh-issue-card`;

      const labelsHtml = (issue.labels || []).map(l => `
        <span class="gh-label" style="background:#${l.color}22;color:#${l.color};border:1px solid #${l.color}44;">
          ${escapeHtml(l.name)}
        </span>
      `).join('');

      const assigneesHtml = (issue.assignees || []).map(a => `
        <img src="${a.avatar_url}" title="${escapeHtml(a.login)}" class="gh-avatar-xs">
      `).join('');

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-weight:700;font-size:0.75rem;color:var(--accent-red);">#${issue.number}</span>
          <div style="display:flex;gap:4px;align-items:center;">
            ${assigneesHtml}
          </div>
        </div>

        <div style="font-weight:600;font-size:0.88rem;margin-bottom:6px;line-height:1.3;">
          <a href="${issue.html_url}" target="_blank" rel="noopener" style="color:var(--text-primary);text-decoration:none;">
            ${escapeHtml(issue.title)}
          </a>
        </div>

        ${labelsHtml ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">${labelsHtml}</div>` : ''}

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:6px;border-top:1px solid var(--border-color);">
          <a href="${issue.html_url}" target="_blank" rel="noopener" style="font-size:0.75rem;color:var(--text-muted);display:flex;align-items:center;gap:4px;text-decoration:none;">
            <i data-lucide="external-link" style="width:12px;height:12px;"></i> GitHub
          </a>

          ${issue.is_imported ? `
            <span class="badge" style="background:rgba(255,255,255,0.06);color:var(--text-muted);font-size:0.7rem;">
              <i data-lucide="check" style="width:10px;height:10px;"></i> Linked Task
            </span>
          ` : `
            <button class="btn btn-secondary btn-xs btn-import-gh-task" data-issue-id="${issue.id}">
              <i data-lucide="download" style="width:12px;height:12px;"></i> Import to Task
            </button>
          `}
        </div>
      `;

      const btnImport = card.querySelector('.btn-import-gh-task');
      if (btnImport && onImportTask) {
        btnImport.addEventListener('click', (e) => {
          e.stopPropagation();
          onImportTask(data.projectId, issue);
        });
      }

      targetContainer.appendChild(card);
    });
  };

  renderCards(container.querySelector('#gh-cards-todo'), todoIssues);
  renderCards(container.querySelector('#gh-cards-in-progress'), inProgressIssues);
  renderCards(container.querySelector('#gh-cards-done'), doneIssues);

  // Attach event handlers
  const btnOAuth = container.querySelector('#btn-gh-oauth-login');
  if (btnOAuth && onOAuthLogin) {
    btnOAuth.addEventListener('click', onOAuthLogin);
  }

  const btnBannerOAuth = container.querySelector('#btn-gh-banner-login');
  if (btnBannerOAuth && onOAuthLogin) {
    btnBannerOAuth.addEventListener('click', onOAuthLogin);
  }

  const btnLogout = container.querySelector('#btn-gh-logout');
  if (btnLogout && onDisconnect) {
    btnLogout.addEventListener('click', onDisconnect);
  }

  const btnRefresh = container.querySelector('#btn-gh-refresh');
  if (btnRefresh && onRefresh) {
    btnRefresh.addEventListener('click', () => onRefresh(data.projectId));
  }

  const btnSettings = container.querySelector('#btn-gh-settings');
  if (btnSettings && onConnectRepo) {
    btnSettings.addEventListener('click', () => onConnectRepo(data.projectId));
  }

  const btnGuideHeader = container.querySelector('#btn-gh-guide-header');
  if (btnGuideHeader && onOpenGuide) {
    btnGuideHeader.addEventListener('click', onOpenGuide);
  }

  const btnCreateIssue = container.querySelector('#btn-gh-create-issue');
  if (btnCreateIssue && onCreateIssue) {
    btnCreateIssue.addEventListener('click', () => onCreateIssue(data.projectId));
  }

  if (window.lucide) window.lucide.createIcons();
}
