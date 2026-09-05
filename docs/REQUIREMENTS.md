# Software Requirements Specification (SRS) - SCJ28 (v0.3.2)

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the SCJ28 Academic & Startup Task Manager. It defines the functional capabilities, performance criteria, user interaction rules, data integrity guidelines, and architectural constraints necessary for developer implementation and maintenance.

### 1.2 Scope
SCJ28 is a single-page task & diary management web application engineered for organizing university course workloads (around 6 main classes), personal goals, and startup projects. It provides dynamic hierarchical categorization, 4-tier task priorities, multi-view execution layouts (List, Kanban, Calendar), Markdown Project & Class Diaries with clipboard image pasting and task linking, browser desktop notifications, compact card expand/collapse interactions, and full database JSON import/export capability.

---

## 2. System Architecture & Tech Constraints

- **Backend**: Node.js REST API with Express.js framework (`server.js`).
- **Database Engine**: Embedded SQLite3 database via synchronous `better-sqlite3` driver (`database.js`).
- **Storage**: Server filesystem storage at `./uploads/diary-images/` for pasted markdown images & `./bkg-image/` for custom wallpaper background images.
- **Frontend Architecture**: Dependency-free Vanilla HTML5, standard CSS3 variables, `marked.js` markdown parser, and ES6 JavaScript (`public/app.js`).
- **Styling Paradigm**: Minimalist dark theme (`#0a0a0a` background, `#ff3333` accent red, glassmorphic blurred panels with customizable panel dark opacity).

---

## 3. Functional Requirements (FR)

### 3.1 Category & Project Management
- **FR-01 (Category & Project CRUD)**: The system shall allow users to create, edit (name, icon, color), and delete top-level Categories and Projects in the left sidebar tree.
- **FR-02 (Project Creation & Association)**: The system shall allow users to create and edit Projects bound to a parent Category.
- **FR-03 (Cascading Deletion)**: Deleting a Project or Category shall automatically perform a cascading delete of all associated Tasks, Subtasks, Diaries, and Diary Task links.
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

### 3.3 Project & Class Diaries Subsystem
- **FR-07 (Navigation Sub-Tabs & All Diaries Filter)**: Selecting any Category or Project in the left sidebar displays top sub-tabs (`Tasks` | `Diaries`) for that context. The left sidebar also includes an "All Diaries" smart filter item.
- **FR-08 (Diary CRUD & Markdown Rendering)**: Users can create, edit, and delete diary entries. Content supports full Markdown rendering (using `marked.js` with GFM task lists `[ ]` and line break support `\n`).
- **FR-09 (Clipboard Image Paste & Storage)**: Pasting screenshots/images (`Ctrl+V`) into the diary Markdown editor textarea automatically uploads the image to `./uploads/diary-images/` via `POST /api/diaries/upload-image` and embeds standard Markdown image tags `![image](/uploads/diary-images/filename)` into the text.
- **FR-10 (Task Linking & Attachment)**: Users can attach/link multiple existing tasks from the project/category to a diary entry via junction table `diary_tasks`.
- **FR-11 (Compact Card & Click-to-Expand Interaction)**: Task and Diary cards render in compact mode by default. Clicking the header area or chevron button expands the card to reveal full details/markdown. Text selection inside card details does not trigger card collapse.

### 3.4 Views & Dynamic Filtering
- **FR-12 (Multi-View Layouts)**: The UI shall support three task view modes (List View, Kanban Board View, Calendar View) and a dedicated Diaries View.
- **FR-13 (Smart Filters)**: The system shall support one-click smart sidebar filtering (`All Tasks`, `Due Today`, `Next 7 Days`, `Overdue`, `All Diaries`).
- **FR-14 (Full-Text Search)**: The system shall provide instant debounced search filtering across task titles/descriptions and diary titles/content.

### 3.5 Data Backup & Portability
- **FR-15 (JSON Database Export)**:
  - The system shall provide a REST endpoint `GET /api/export` that outputs the full SQLite database state (all categories, projects, tasks, subtasks, diaries, and diary task links) as a structured JSON file.
- **FR-16 (JSON Database Import & Strategy Selection)**:
  - The system shall provide a REST endpoint `POST /api/import` accepting JSON backups (`mode: replace` or `merge`).
  - The backup options and import modals explicitly instruct users that JSON files contain all database records, while uploaded images (`./uploads/diary-images/`) must be manually backed up separately from the server directory if desired.

### 3.6 GitHub Integration & Live Board Subsystem
- **FR-17 (GitHub Repository & Project Linkage)**: The system shall allow users to link a SCJ28 Project to a GitHub repository (`owner/repository`) and optional GitHub Project (v2) Board ID.
- **FR-18 (GitHub OAuth 2.0 Authentication)**: The system shall support user account authorization via GitHub OAuth 2.0 flow (`/api/github/auth`, `/api/github/callback`), persisting client credentials safely in `.env`.
- **FR-19 (Live Glassmorphic GitHub Kanban Board)**: The `GitHub Board` sub-tab shall render real-time repository issues across status columns (*To Do*, *In Progress*, *Done*) displaying issue numbers (`#123`), label tags, assignees, and GitHub HTML links.
- **FR-20 (On-Demand Task Import)**: Users shall be able to import live GitHub issues as local SCJ28 database tasks (`tasks.db`), preserving issue numbers and links.
- **FR-21 (Quick Issue Creation)**: The system shall allow users to create new issues directly on GitHub from within SCJ28.
- **FR-22 (Interactive Setup Guidance Modal)**: The system shall provide an interactive setup guide modal (`modal-github-guide`) walking users through OAuth App registration, credentials setup, and repository connection.

### 3.6 Desktop Notifications & Frequency Engine
- **FR-17 (Web Desktop Alerts)**: Polling engine runs every 60 seconds firing HTML5 browser desktop alerts for due and overdue tasks based on user notification frequency preferences.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance & Responsiveness
- **NFR-01 (Low Latency)**: REST API responses shall execute within under 50ms for local SQLite queries.
- **NFR-02 (Zero-Build Frontend)**: The client application must run directly in standard modern web browsers (Chrome, Firefox, Safari, Edge) without requiring compilation tools.

### 4.2 Data Integrity & Security
- **NFR-03 (Transactional Safety)**: Foreign keys (`foreign_keys = ON`) and cascade deletions must be enforced by SQLite. Import operations must execute within single SQLite transactions (`db.transaction()`).
- **NFR-04 (Sanitization)**: HTML special characters in titles and descriptions must be escaped on client rendering to prevent Cross-Site Scripting (XSS).

### 4.3 Design & UX System
- **NFR-05 (Theme Consistency)**: Minimalist dark mode with customizable panel opacity (60% to 100%).
- **NFR-06 (Form Accessibility & Dark Combos)**: Form inputs, datetime-local calendar icons, and `<select>` dropdown option popups must render in dark mode styling (`#1a1a1a` option background, white calendar icon, 38px select right padding).
