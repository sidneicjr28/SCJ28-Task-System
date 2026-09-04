# Use Case Specifications - SCJ28 (v0.3.1)

This document details the primary use cases for the SCJ28 Academic & Startup Task Manager.

---

## Use Case Overview Diagram

```
                 +-------------------------------------------------+
                 |                    SCJ28 System                 |
                 |                                                 |
  +-------+      |   (UC-01: Create Task with Context Auto-Select) |
  |       | ---->|                                                 |
  |       | ---->|   (UC-02: Manage Multi-View & Kanban Drag-Drop) |
  |       |      |                                                 |
  | User  | ---->|   (UC-03: Filter & Search Tasks & Diaries)      |
  |       |      |                                                 |
  |       | ---->|   (UC-04: Backup & Restore Data via JSON)       |
  |       |      |                                                 |
  |       | ---->|   (UC-05: Manage Categories & Projects)        |
  |       |      |                                                 |
  |       | ---->|   (UC-06: Manage Project & Class Diaries)       |
  |       |      |                                                 |
  |       | ---->|   (UC-07: Receive Desktop Task Alerts)          |
  +-------+      +-------------------------------------------------+
```

---

## UC-01: Create Task with Project Context Recognition

- **Primary Actor**: User (Student / Developer)
- **Description**: The user opens the Task Creation modal to record a new task. If a project is currently open in the active view, the modal automatically pre-selects that project while keeping the dropdown editable.
- **Preconditions**: User is on the SCJ28 web application interface.

### Main Success Flow
1. User clicks the "New Task" button (located in the sidebar or top navigation bar).
2. System intercepts the click and executes `openCreateTaskModal()`.
3. System checks `state.activeProject`:
   - **If active project exists**: System sets `taskProject.value` to `state.activeProject`.
   - **Else if active category exists**: System sets `taskProject.value` to the category's first project.
   - **Else**: System sets `taskProject.value` to the default project in the list.
4. System displays the `#modal-task` modal popup over the dark backdrop.
5. User enters task title, description, priority (P1-P4), due date/time, and subtask items.
6. User optionally changes the selected project using the interactive `<select>` dropdown if desired.
7. User clicks "Save Task".
8. System sends `POST /api/tasks` payload to the backend REST API.
9. Backend inserts task and subtasks into SQLite database inside `tasks.db`.
10. System closes the modal, refreshes task views, updates dashboard counters, and displays a toast message ("Task created successfully!").

---

## UC-02: Manage View Modes & Kanban Drag-and-Drop

- **Primary Actor**: User
- **Description**: User switches view layouts between List, Kanban Board, and Calendar views to visualize workload.
- **Preconditions**: At least one task exists in the system.

### Main Success Flow
1. User clicks a view mode button in the top bar (`List`, `Kanban`, or `Calendar`).
2. System updates `state.currentView` and toggles active CSS display classes.
3. **If Kanban View selected**:
   - System partitions tasks into three columns: `To Do`, `In Progress`, and `Completed`.
   - User drags a task card from one column and drops it onto another column.
   - System captures the `drop` event, extracts `taskId`, and calls `PATCH /api/tasks/:id/status`.
   - Backend updates task status in SQLite database.
4. **If Calendar View selected**:
   - System renders the current month's calendar grid with task pills.

---

## UC-03: Filter & Search Tasks & Diaries

- **Primary Actor**: User
- **Description**: User filters tasks and diaries by smart criteria, category/project hierarchy, status, or search query.

### Main Success Flow
1. User clicks a smart filter item in the sidebar (`Due Today`, `Next 7 Days`, `Overdue`, `All Tasks`, or `All Diaries`).
2. Alternatively, user clicks a specific Category or Project item in the sidebar tree:
   - System displays top sub-tabs (`Tasks` | `Diaries`) for that category/project container.
3. Alternatively, user types text into the search bar:
   - System debounces input (250ms delay) and fetches matching records.

---

## UC-04: Backup & Restore Data via JSON

- **Primary Actor**: User / System Administrator
- **Description**: User opens the Data Backup options modal via the navbar database icon to export all database records (tasks, projects, categories, settings, diaries, and diary-task links) into a single JSON file or import a JSON backup file.

### Sub-Flow A: Exporting Data
1. User clicks the Database icon (`#btn-data-menu`) in the top navigation bar.
2. System opens the Data Backup Options modal (`#modal-data-options`).
3. User clicks "Export JSON".
4. System executes `GET /api/export`.
5. Backend queries SQLite tables (`categories`, `projects`, `tasks`, `subtasks`, `diaries`, `diary_tasks`) and constructs a JSON payload.
6. Client receives payload and triggers browser file download `SCJ28_Backup_YYYY-MM-DD.json`.

### Sub-Flow B: Importing Data
1. User opens Data Backup Options modal and selects a JSON file.
2. Client parses JSON data and displays summary breakdown (including categories, projects, tasks, subtasks, and diary counts).
3. User selects import strategy (`Replace All` or `Merge`) and clicks "Confirm Import".
4. Backend executes an atomic SQLite transaction (`db.transaction()`).
5. Client closes modal and displays success toast.

---

## UC-05: Category & Project Administration

- **Primary Actor**: User
- **Description**: User creates categories (e.g. university courses, startup ventures) and sub-projects to organize tasks and diaries hierarchically.

---

## UC-06: Manage Project & Class Diaries with Markdown & Image Upload

- **Primary Actor**: User (Student / Developer)
- **Description**: User creates, edits, and reads markdown diary entries for course lecture notes, sprint logs, or project thoughts.
- **Preconditions**: User selects a Category or Project and switches to the "Diaries" sub-tab (or selects "All Diaries" in sidebar).

### Main Success Flow
1. User clicks "New Entry" button (positioned on the right side of the filter bar).
2. System opens the `#modal-diary` modal dialog.
3. User enters title, selects project, and types entry content in Markdown format.
4. **Pasting Screenshots**: User pastes an image from the clipboard (`Ctrl+V`) directly into the textarea:
   - System catches `paste` event, extracts image blob, and sends `POST /api/diaries/upload-image`.
   - Backend saves file to `./uploads/diary-images/filename.png` and returns static URL.
   - Client inserts `![pasted image](/uploads/diary-images/filename.png)` tag into the textarea.
5. **Live Markdown Preview**: User clicks the "Preview" tab to preview rendered GFM markdown.
6. **Task Attachment**: User checks tasks in the "Attach Tasks" checklist picker to link them to the entry.
7. User clicks "Save Entry".
8. System sends `POST /api/diaries` or `PUT /api/diaries/:id`.
9. System reloads diaries list and displays compact entry cards.
10. **Card Expansion**: User clicks the header or chevron of a diary card to expand full rendered Markdown text and task pills.

---

## UC-07: Desktop Task Alerts & Notifications

- **Primary Actor**: User / Browser Notification Engine
- **Description**: The application sends native OS notifications for due or overdue tasks.
