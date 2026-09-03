// HTML5 Desktop Notification Service (Single Responsibility Principle)
import { showToast } from '../ui/toast.js';

class NotificationService {
  constructor() {
    this.timestamps = JSON.parse(localStorage.getItem('scj28_notified_timestamps') || '{}');
  }

  init() {
    const btnNavBell = document.getElementById('btn-notifications');
    const banner = document.getElementById('notification-banner');
    const btnEnable = document.getElementById('btn-enable-notifications');
    const btnDismiss = document.getElementById('btn-dismiss-notifications');

    if (!('Notification' in window)) {
      if (btnNavBell) btnNavBell.style.display = 'none';
      if (banner) banner.style.display = 'none';
      return;
    }

    this.updateBellState();

    const requestPerm = async () => {
      const perm = await Notification.requestPermission();
      this.updateBellState();
      if (perm === 'granted') {
        this.showNotification('SCJ28 Notifications Enabled', 'You will receive alerts for due and overdue tasks!');
        showToast('Desktop notifications enabled!');
      } else if (perm === 'denied') {
        showToast('Notification permissions were blocked.');
      }
    };

    if (btnEnable) btnEnable.addEventListener('click', requestPerm);
    if (btnDismiss && banner) {
      btnDismiss.addEventListener('click', () => {
        banner.style.display = 'none';
      });
    }

    if (btnNavBell) {
      btnNavBell.addEventListener('click', () => {
        if (Notification.permission === 'default') {
          requestPerm();
        } else if (Notification.permission === 'granted') {
          this.showNotification('SCJ28 Desktop Alert Test', 'Notifications are active! You will be alerted when tasks are due.');
          showToast('Desktop test notification sent!');
        } else if (Notification.permission === 'denied') {
          showToast('Notifications blocked. Enable them in browser settings.');
        }
      });
    }
  }

  updateBellState() {
    const btnNavBell = document.getElementById('btn-notifications');
    const banner = document.getElementById('notification-banner');

    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      if (banner) banner.style.display = 'flex';
      if (btnNavBell) {
        btnNavBell.style.borderColor = 'var(--border-color)';
        btnNavBell.title = 'Click to enable Browser Desktop Notifications';
      }
    } else {
      if (banner) banner.style.display = 'none';
      if (btnNavBell) {
        if (Notification.permission === 'granted') {
          btnNavBell.style.borderColor = 'var(--accent-red)';
          btnNavBell.style.color = 'var(--accent-red)';
          btnNavBell.title = 'Desktop Notifications Enabled (Click to test)';
        } else if (Notification.permission === 'denied') {
          btnNavBell.style.opacity = '0.5';
          btnNavBell.title = 'Desktop Notifications Denied in Browser Settings';
        }
      }
    }
  }

  showNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
      const n = new Notification(title, {
        body,
        icon: 'SCJ28-square.png',
        silent: false
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (e) {
      console.warn('Could not launch Notification:', e);
    }
  }

  checkAndSendDueNotifications(tasks) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = Date.now();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    tasks.forEach(task => {
      if (task.status === 'done') return;
      const remFreq = task.reminder_frequency || 'smart';
      if (remFreq === 'none') return;

      const lastNotified = this.timestamps[task.id] || 0;
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      const isOverdue = dueDate && dueDate < new Date();
      const isDueToday = dueDate && dueDate <= todayEnd && dueDate >= new Date();

      let intervalMs = Infinity;

      if (remFreq === 'hourly') {
        intervalMs = 3600 * 1000;
      } else if (remFreq === 'every_3h') {
        intervalMs = 3 * 3600 * 1000;
      } else if (remFreq === 'twice_daily') {
        intervalMs = 12 * 3600 * 1000;
      } else if (remFreq === 'daily') {
        intervalMs = 24 * 3600 * 1000;
      } else if (remFreq === 'due_only') {
        if (isOverdue || isDueToday) intervalMs = 24 * 3600 * 1000;
      } else if (remFreq === 'smart') {
        if (task.priority === 1) {
          intervalMs = 3 * 3600 * 1000;
        } else if (task.priority === 2) {
          intervalMs = 12 * 3600 * 1000;
        } else if (task.priority === 3) {
          intervalMs = 24 * 3600 * 1000;
        } else if (task.priority === 4 && (isOverdue || isDueToday)) {
          intervalMs = 24 * 3600 * 1000;
        }
      }

      if (now - lastNotified >= intervalMs) {
        let pLabel = task.priority === 1 ? '🔥 URGENT' : task.priority === 2 ? '⚡ HIGH' : task.priority === 3 ? '📌 MEDIUM' : '🔹 LOW';
        let statusPrefix = isOverdue ? '⚠️ OVERDUE: ' : isDueToday ? '📌 DUE TODAY: ' : '⏰ REMINDER: ';
        let dueStr = dueDate ? `Due: ${dueDate.toLocaleString()}` : 'No fixed due date';

        this.showNotification(
          `${statusPrefix}${task.title}`,
          `[${pLabel}] Project: ${task.project_name}\n${dueStr}`
        );

        this.timestamps[task.id] = now;
        try {
          localStorage.setItem('scj28_notified_timestamps', JSON.stringify(this.timestamps));
        } catch (e) {}
      }
    });
  }
}

export const notificationService = new NotificationService();
