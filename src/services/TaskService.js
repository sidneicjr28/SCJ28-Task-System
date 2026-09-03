const taskRepo = require('../repositories/TaskRepository');
const subtaskRepo = require('../repositories/SubtaskRepository');

class TaskService {
  getTasks(filters) {
    const tasks = taskRepo.findFiltered(filters);
    return tasks.map(task => {
      const subtasks = subtaskRepo.findByTaskId(task.id);
      return { ...task, subtasks };
    });
  }

  getTaskById(id) {
    const task = taskRepo.findById(id);
    if (!task) return null;
    const subtasks = subtaskRepo.findByTaskId(id);
    return { ...task, subtasks };
  }

  createTask(taskData) {
    const taskId = taskRepo.create(taskData);

    if (Array.isArray(taskData.subtasks) && taskData.subtasks.length > 0) {
      taskData.subtasks.forEach((st, idx) => {
        const titleStr = typeof st === 'string' ? st : st.title;
        const compVal = (typeof st === 'object' && st.completed) ? 1 : 0;
        if (titleStr && titleStr.trim()) {
          subtaskRepo.create(taskId, titleStr.trim(), compVal, idx);
        }
      });
    }

    return this.getTaskById(taskId);
  }

  updateTask(id, taskData) {
    taskRepo.update(id, taskData);

    if (Array.isArray(taskData.subtasks)) {
      subtaskRepo.deleteByTaskId(id);
      taskData.subtasks.forEach((st, idx) => {
        const titleStr = typeof st === 'string' ? st : st.title;
        const compVal = (typeof st === 'object' && st.completed) ? 1 : 0;
        if (titleStr && titleStr.trim()) {
          subtaskRepo.create(id, titleStr.trim(), compVal, idx);
        }
      });
    }

    return this.getTaskById(id);
  }

  updateTaskStatus(id, status) {
    if (!['todo', 'in_progress', 'done'].includes(status)) {
      throw new Error('Invalid status');
    }
    taskRepo.updateStatus(id, status);
    return { id: Number(id), status };
  }

  deleteTask(id) {
    return taskRepo.delete(id);
  }

  toggleSubtask(subtaskId) {
    const result = subtaskRepo.toggle(subtaskId);
    if (!result) throw new Error('Subtask not found');
    return result;
  }
}

module.exports = new TaskService();
