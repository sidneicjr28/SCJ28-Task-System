# Software Requirements Specification (SRS) - SCJ28

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the SCJ28 Academic & Startup Task Manager. It defines the functional capabilities, performance criteria, user interaction rules, data integrity guidelines, and architectural constraints necessary for developer implementation and maintenance.

### 1.2 Scope
SCJ28 is a single-page task management web application engineered for organizing university course workloads, personal goals, and startup projects. It provides dynamic hierarchical categorization, 4-tier task priorities, multi-view execution layouts (List, Kanban, Calendar), automated project context recognition, browser desktop notifications, and full database JSON import/export capability.

---

## 2. System Architecture & Tech Constraints

- **Backend**: Node.js REST API with Express.js framework (`server.js`).
- **Database Engine**: Embedded SQLite3 database via synchronous `better-sqlite3` driver (`database.js`).
- **Frontend Architecture**: Dependency-free Vanilla HTML5, standard CSS3 variables, and ES6 JavaScript (`public/app.js`).
- **Styling Paradigm**: Minimalist dark theme (`#0a0a0a` background, `#111111` sidebar, `#161616` surfaces, `#ff3333` accent red).

---

## 3. Functional Requirements (FR)

### 3.1 Category & Project Management
- **FR-01 (Category & Project CRUD)**: The system shall allow users to create, edit (name, icon, color), and delete top-level Categories and Projects in the left sidebar tree.
- **FR-02 (Project Creation & Association)**: The system shall allow users to create and edit Projects bound to a parent Category.
- **FR-03 (Cascading Deletion)**: Deleting a Project or Category shall automatically perform a cascading delete of all associated Tasks and Subtasks.
- **FR-03b (Theme & Color Customization)**: The system shall allow users to change the website accent color theme (default red `#ff3333`) via a preset palette or custom hex picker, persisting choice in `settings.json`.

### 3.2 Task & Subtask Management
- **FR-04 (Task Creation & Context Recognition)**:
  - The task modal shall allow specifying a title, description, project association, priority level (P1 to P4), status (`todo`, `in_progress`, `done`), due date/time, notification reminder frequency (`smart`, `hourly`, `every_3h`, `twice_daily`, `daily`, `due_only`, `none`), and subtask list.
  - **Project Auto-Selection**: If a Project is currently active in the UI when clicking "New Task", the system **must pre-select** that active project in the project dropdown while preserving full dropdown interactivity so the user can manually pick a different project if desired.
- **FR-05 (Priority Levels)**: Tasks must support 4 priority tiers:
  - `P1`: Urgent (Red accent highlight)
  - `2`: High (Dark Red accent highlight)
  - `3`: Medium (Standard Gray/White - Default)
  - `4`: Low (Muted display)
- **FR-06 (Subtasks Checklist)**: Each task may contain an ordered list of subtask items. Checking off a subtask must dynamically update inline progress bars and completion percentages (`completed / total`).

### 3.3 Views & Dynamic Filtering
- **FR-07 (Multi-View Layouts)**: The UI shall support three view modes:
  1. **List View**: Chronological view with status and priority dropdown filters.
  2. **Kanban Board View**: Interactive drag-and-drop board across 3 columns (`To Do`, `In Progress`, `Completed`). Dropping a card into a column updates the task status in real-time.
  3. **Calendar View**: Monthly grid rendering task pills on their respective ISO due dates.
- **FR-08 (Smart Due Filters)**: The system shall support one-click smart sidebar filtering:
  - `All Tasks`: Displays all active and completed tasks.
  - `Due Today`: Filters tasks due before 23:59:59 of the current date.
  - `Next 7 Days`: Filters upcoming tasks due within the next 7 days.
  - `Overdue`: Filters incomplete tasks with a due date strictly prior to the current timestamp.
- **FR-09 (Full-Text Search)**: The system shall provide instant client debounced search filtering across task titles and descriptions.

### 3.4 Data Backup & Portability
- **FR-10 (JSON Database Export)**:
  - The system shall provide a REST endpoint `GET /api/export` that outputs the full SQLite database state (all categories, projects, tasks including `reminder_frequency`, and subtasks) as a structured JSON file.
  - The client shall trigger a direct browser download named `scj28_backup_YYYY-MM-DD.json`.
- **FR-11 (JSON Database Import & Strategy Selection)**:
  - The system shall provide a REST endpoint `POST /api/import` accepting JSON backups.
  - The system shall present an interactive modal showing the item counts found in the JSON file and offer two import strategies:
    - **Replace All**: Clears existing database tables in an atomic transaction and restores the backup.
    - **Merge**: Retains existing data and inserts imported items, dynamically re-mapping Category and Project foreign keys.

### 3.5 Desktop Notifications & Frequency Engine
- **FR-12 (Web Desktop Alerts & Frequency Engine)**:
  - The system shall integrate with the HTML5 Browser Notification API.
  - When enabled, a background polling check runs every 60 seconds.
  - **Smart Priority Frequency**: Urgent (P1) tasks notify frequently (every 3 hours / 4x per day), High (P2) tasks notify 2x per day (every 12 hours), Medium (P3) tasks notify 1x per day (every 24 hours), and Low (P4) tasks notify at due time.
  - Custom user overrides (`hourly`, `every_3h`, `twice_daily`, `daily`, `due_only`, `none`) are respected and stored persistently.
  - Notification timestamps are stored in persistent client storage (`localStorage`) to prevent duplicate alerts upon page reload.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance & Responsiveness
- **NFR-01 (Low Latency)**: REST API responses shall execute within under 50ms for local SQLite queries.
- **NFR-02 (Zero-Build Frontend)**: The client application must run directly in standard modern web browsers (Chrome, Firefox, Safari, Edge) without requiring compilation tools (Webpack, Vite, Babel).

### 4.2 Data Integrity & Security
- **NFR-03 (Transactional Safety)**: Foreign keys (`foreign_keys = ON`) and cascade deletions must be enforced by SQLite. Import operations must execute within single SQLite transactions (`db.transaction()`) to prevent partial database corruption.
- **NFR-04 (Sanitization)**: HTML special characters in task titles and descriptions must be escaped on client rendering to prevent Cross-Site Scripting (XSS).

### 4.3 Design & UX System
- **NFR-05 (Theme Consistency)**: The UI must strictly follow the minimalist black/white/red dark mode design palette:
  - Primary Background: `#0a0a0a`
  - Sidebar: `#111111`
  - Surfaces/Cards: `#161616` / `#1c1c1c`
  - Accent Color: `#ff3333`
  - Muted Text: `#888888`
- **NFR-06 (Form Input Accessibility)**: All input text fields containing icons must maintain `z-index: 2`, `pointer-events: none` on icons, and appropriate left padding (`padding-left: 38px`) to ensure clear visual alignment.
