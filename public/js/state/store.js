// Centralized Reactive Application Store (Single Responsibility Principle)

class Store {
  constructor() {
    this.state = {
      categories: [],
      tasks: [],
      diaries: [],
      stats: { total: 0, completed: 0, pending: 0, overdue: 0, dueToday: 0 },
      activeFilter: 'all', // 'all', 'today', 'upcoming', 'overdue', 'diaries'
      activeCategory: null,
      activeProject: null,
      activeTab: 'tasks', // 'tasks', 'diaries', 'github'
      currentView: 'list', // 'list', 'kanban', 'calendar'
      searchQuery: '',
      filterStatus: '',
      filterPriority: '',
      calendarDate: new Date(),
      editingTaskId: null,
      editingDiaryId: null
    };

    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(partialState) {
    this.state = { ...this.state, ...partialState };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

export const store = new Store();
