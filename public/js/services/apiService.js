// REST API Client Service (Interface Segregation & Dependency Inversion)

export const apiService = {
  async getCategories() {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async createCategory(payload) {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  async updateCategory(id, payload) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  async deleteCategory(id) {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json();
  },

  async createProject(payload) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async updateProject(id, payload) {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async deleteProject(id) {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },

  async getSettings() {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(payload) {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async getTasks(paramsObject = {}) {
    const params = new URLSearchParams();
    if (paramsObject.filter && ['today', 'upcoming', 'overdue'].includes(paramsObject.filter)) {
      params.append('filter', paramsObject.filter);
    }
    if (paramsObject.category_id) params.append('category_id', paramsObject.category_id);
    if (paramsObject.project_id) params.append('project_id', paramsObject.project_id);
    if (paramsObject.search) params.append('search', paramsObject.search);
    if (paramsObject.status) params.append('status', paramsObject.status);

    const res = await fetch(`/api/tasks?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    let tasks = await res.json();

    if (paramsObject.priority) {
      tasks = tasks.filter(t => t.priority == paramsObject.priority);
    }

    return tasks;
  },

  async createTask(payload) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create task');
    return data;
  },

  async updateTask(id, payload) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update task');
    return data;
  },

  async updateTaskStatus(id, status) {
    const res = await fetch(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async deleteTask(id) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  async toggleSubtask(id) {
    const res = await fetch(`/api/subtasks/${id}/toggle`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to toggle subtask');
    return res.json();
  },

  async getStats() {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async exportBackup() {
    const res = await fetch('/api/export');
    if (!res.ok) throw new Error('Failed to export backup');
    return res.json();
  },

  async importBackup(payload) {
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to import backup');
    return data;
  },

  async getBackground() {
    const res = await fetch('/api/background');
    if (!res.ok) throw new Error('Failed to fetch background image info');
    return res.json();
  },

  async uploadBackground(payload) {
    const res = await fetch('/api/background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload background image');
    return data;
  },

  async removeBackground() {
    const res = await fetch('/api/background', { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove background image');
    return data;
  },

  async getDiaries(paramsObject = {}) {
    const params = new URLSearchParams();
    if (paramsObject.category_id) params.append('category_id', paramsObject.category_id);
    if (paramsObject.project_id) params.append('project_id', paramsObject.project_id);
    if (paramsObject.search) params.append('search', paramsObject.search);

    const res = await fetch(`/api/diaries?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch diaries');
    return res.json();
  },

  async getDiaryById(id) {
    const res = await fetch(`/api/diaries/${id}`);
    if (!res.ok) throw new Error('Failed to fetch diary');
    return res.json();
  },

  async createDiary(payload) {
    const res = await fetch('/api/diaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create diary entry');
    return data;
  },

  async updateDiary(id, payload) {
    const res = await fetch(`/api/diaries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update diary entry');
    return data;
  },

  async deleteDiary(id) {
    const res = await fetch(`/api/diaries/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete diary entry');
    return res.json();
  },

  async uploadDiaryImage(payload) {
    const res = await fetch('/api/diaries/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload diary image');
    return data;
  },

  async getGitHubAuthUrl() {
    const res = await fetch('/api/github/auth');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get GitHub auth URL');
    return data;
  },

  async getGitHubStatus() {
    const res = await fetch('/api/github/status');
    if (!res.ok) throw new Error('Failed to get GitHub connection status');
    return res.json();
  },

  async disconnectGitHub() {
    const res = await fetch('/api/github/disconnect', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to disconnect GitHub account');
    return res.json();
  },

  async saveGitHubConfig(payload) {
    const res = await fetch('/api/github/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save GitHub credentials');
    return res.json();
  },

  async getGitHubBoard(projectId) {
    const res = await fetch(`/api/github/projects/${projectId}/board`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch GitHub board');
    return data;
  },

  async createGitHubIssue(projectId, payload) {
    const res = await fetch(`/api/github/projects/${projectId}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create GitHub issue');
    return data;
  },

  async importGitHubTask(projectId, issueData) {
    const res = await fetch(`/api/github/projects/${projectId}/import-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issueData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to import GitHub task');
    return data;
  }
};
