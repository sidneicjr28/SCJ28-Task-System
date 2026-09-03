// Calendar View Component Renderer (Single Responsibility Principle)

export function renderCalendarView(elements, tasks, calendarDate, onSelectTask) {
  const { calendarDays, calMonthYear } = elements;
  if (!calendarDays || !calMonthYear) return;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  calMonthYear.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendarDays.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'cal-day empty';
    calendarDays.appendChild(emptyDiv);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = cellDateStr === todayStr;

    const dayDiv = document.createElement('div');
    dayDiv.className = `cal-day ${isToday ? 'today' : ''}`;
    dayDiv.innerHTML = `<span class="cal-day-num">${day}</span>`;

    const dayTasks = tasks.filter(t => t.due_date && t.due_date.slice(0, 10) === cellDateStr);

    dayTasks.forEach(t => {
      const pill = document.createElement('div');
      pill.className = 'cal-task-pill';
      pill.textContent = t.title;
      pill.title = t.title;
      pill.addEventListener('click', () => {
        if (onSelectTask) onSelectTask(t.id);
      });
      dayDiv.appendChild(pill);
    });

    calendarDays.appendChild(dayDiv);
  }
}
