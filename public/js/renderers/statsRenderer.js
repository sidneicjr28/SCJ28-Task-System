// Dashboard Statistics Renderer (Single Responsibility Principle)

export function renderStats(elements, stats) {
  const { statTotal, statPending, statOverdue, statCompleted, cntAll, cntToday, cntUpcoming, cntOverdue } = elements;

  if (statTotal) statTotal.textContent = stats.total || 0;
  if (statPending) statPending.textContent = stats.pending || 0;
  if (statOverdue) statOverdue.textContent = stats.overdue || 0;
  if (statCompleted) statCompleted.textContent = stats.completed || 0;

  if (cntAll) cntAll.textContent = stats.total || 0;
  if (cntToday) cntToday.textContent = stats.dueToday || 0;
  if (cntUpcoming) cntUpcoming.textContent = (stats.total - stats.completed - stats.dueToday) > 0 ? (stats.total - stats.completed - stats.dueToday) : 0;
  if (cntOverdue) cntOverdue.textContent = stats.overdue || 0;
}
