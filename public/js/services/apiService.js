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

  async createProject(payload) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async deleteProject(id) {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
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
  }
};
