# Use Case Specifications - SCJ28

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
  | User  | ---->|   (UC-03: Filter & Search Tasks)                |
  |       |      |                                                 |
  |       | ---->|   (UC-04: Backup & Restore Data via JSON)       |
  |       |      |                                                 |
  |       | ---->|   (UC-05: Manage Categories & Projects)        |
  +-------+      |                                                 |
                 |   (UC-06: Receive Desktop Task Alerts)          |
                 +-------------------------------------------------+
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

### Alternative Flows
- **A1: User cancels creation**: User clicks "Cancel" or the close icon (`X`). System closes the modal without persisting data.
- **A2: Invalid input**: User submits without entering a required title or selecting a project. HTML5 validation blocks submission and highlights required fields.

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
   - System re-renders Kanban counts and card positions.
4. **If Calendar View selected**:
   - System renders the current month's calendar grid.
   - Tasks with due dates appear as interactive pills on their respective day cells.
   - Clicking a task pill opens the Edit Task modal for that task.

---

## UC-03: Filter & Search Tasks

- **Primary Actor**: User
- **Description**: User filters tasks by smart due date criteria, category/project hierarchy, status, or search query.

### Main Success Flow
1. User clicks a smart filter item in the sidebar (`Due Today`, `Next 7 Days`, `Overdue`, or `All Tasks`).
2. System updates `state.activeFilter` and fetches matching tasks from `GET /api/tasks?filter=<filter_type>`.
3. Alternatively, user clicks a specific Category or Project item in the sidebar tree:
   - System sets `state.activeCategory` or `state.activeProject`.
   - System fetches filtered tasks via `GET /api/tasks?category_id=X` or `GET /api/tasks?project_id=Y`.
4. Alternatively, user types text into the header search bar:
   - System debounces input (250ms delay) and sends query via `GET /api/tasks?search=<query>`.
5. System renders the filtered task list and updates summary counts.

---

## UC-04: Backup & Restore Data via JSON

- **Primary Actor**: User / System Administrator
- **Description**: User opens the Data Backup options modal via the navbar database icon to export all database records into a single JSON file or import a JSON backup file.

### Sub-Flow A: Exporting Data
1. User clicks the Database icon (`#btn-data-menu`) in the top navigation bar.
2. System opens the Data Backup Options modal (`#modal-data-options`).
3. User clicks "Export JSON".
4. System executes `GET /api/export`.
5. Backend queries SQLite tables (`categories`, `projects`, `tasks`, `subtasks`) and constructs a JSON payload.
6. Client receives payload and creates a blob download link.
7. Browser saves `scj28_backup_YYYY-MM-DD.json` to user's local disk.

### Sub-Flow B: Importing Data
1. User clicks the Database icon (`#btn-data-menu`) in the top navigation bar.
2. System opens the Data Backup Options modal (`#modal-data-options`).
3. User clicks "Import JSON".
4. System opens browser file selector accepting `.json` files.
3. User selects a valid SCJ28 backup JSON file.
4. Client reads file via HTML5 `FileReader` and parses JSON data.
5. System displays `#modal-import` modal showing summary breakdown of categories, projects, tasks, and subtasks found in the file.
6. User selects import strategy:
   - **Replace All**: Clears current database and restores full backup state.
   - **Merge**: Appends backup records into current database while preserving existing data.
7. User clicks "Confirm Import".
8. Client sends `POST /api/import` payload to backend.
9. Backend executes an atomic SQLite transaction (`db.transaction()`).
10. Backend returns success confirmation.
11. Client closes modal, shows success toast, and refreshes all UI views.

---

## UC-05: Category & Project Administration

- **Primary Actor**: User
- **Description**: User creates categories (e.g. university courses, startup ventures) and sub-projects to organize tasks hierarchically.

### Main Success Flow
1. User clicks the `+` button on the Categories sidebar header or next to a category name.
2. System opens Category (`#modal-category`) or Project (`#modal-project`) creation modal.
3. User fills in category name, icon, and accent color.
4. User clicks submit.
5. System issues `POST /api/categories` or `POST /api/projects`.
6. Backend persists new entry in SQLite and returns created record.
7. Client updates category tree in sidebar and project select dropdowns across task forms.

---

## UC-06: Desktop Task Alerts & Notifications

- **Primary Actor**: User / Browser Notification Engine
- **Description**: The application sends native OS notifications for tasks due today or overdue.

### Main Success Flow
1. User clicks the bell icon in top navigation bar or notification prompt banner.
2. Browser displays native permission prompt requesting notification authorization.
3. User selects "Allow".
4. Application initializes a 60-second background polling timer (`checkAndSendDueNotifications`).
5. When a task's due date matches current day or is overdue, system fires a native browser desktop alert (`new Notification(...)`).
