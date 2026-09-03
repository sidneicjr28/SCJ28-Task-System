# SCJ28 - Academic & Startup Task Manager

## Project Overview
SCJ28 is a lightweight, modern, minimalist task management web application designed for organizing academic course workloads (around 6 main classes), personal goals, and startup/work projects.

The application features a sleek dark-mode user interface, hierarchical task organization, interactive subtask checklists, 4-tier priority levels, multi-view layout modes (List, Kanban Board, Calendar), smart due date filtering, and HTML5 Web Desktop Notifications for due and overdue tasks.

---

## Tech Stack & Architecture

- **Backend**: Node.js + Express.js REST API (`server.js`)
- **Database**: SQLite3 via `better-sqlite3` (`database.js` creating `tasks.db`)
- **Frontend**: Vanilla HTML5, CSS3, and ES6 JavaScript (`public/`)
- **Icons**: Lucide Icons library (`https://unpkg.com/lucide@latest`)
- **Design System**: Minimalist Dark Mode Palette
  - **Background**: `#0a0a0a` (Pure Black)
  - **Sidebar**: `#111111`
  - **Cards & Surfaces**: `#161616` / `#1c1c1c`
  - **Accent Color**: `#ff3333` (Vibrant Red)
  - **Typography**: `#f5f5f5` (Clean White) & `#888888` (Muted Gray)

---

## Core Data Schema

### 1. `categories`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT NOT NULL UNIQUE) e.g., *Academic*, *Personal*, *Work & Startups*
- `icon` (TEXT) e.g., `graduation-cap`, `user`, `briefcase`
- `color` (TEXT)

### 2. `projects`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `category_id` (INTEGER FOREIGN KEY -> `categories.id`)
- `name` (TEXT NOT NULL) e.g., *Data Structures & Algorithms*, *Startup Alpha*
- `description` (TEXT)
- `color` (TEXT)

### 3. `tasks`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `project_id` (INTEGER FOREIGN KEY -> `projects.id`)
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `due_date` (TEXT ISO format `YYYY-MM-DDTHH:mm`)
- `priority` (INTEGER 1..4)
  - `1`: **P1 - Urgent** (Red accent highlight)
  - `2`: **P2 - High** (Dark Red accent)
  - `3`: **P3 - Medium** (Standard Gray/White)
  - `4`: **P4 - Low** (Muted)
- `status` (TEXT: `'todo'`, `'in_progress'`, `'done'`)
- `created_at` / `updated_at` (DATETIME)

### 4. `subtasks`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `task_id` (INTEGER FOREIGN KEY -> `tasks.id` ON DELETE CASCADE)
- `title` (TEXT NOT NULL)
- `completed` (INTEGER: `0` or `1`)
- `position` (INTEGER)

---

## Workspace Layout & File Structure

```
SCJ28/
├── package.json         # Node dependencies (express, better-sqlite3, cors)
├── server.js            # Express REST API server endpoints & routing
├── database.js          # SQLite connection, schema definition & default seed data
├── tasks.db             # Local SQLite database file (auto-generated)
├── SCJ28-square.png     # Application logo
└── public/
    ├── index.html       # Single-page application markup & modals
    ├── styles.css       # Black/White/Red minimalist dark theme CSS
    ├── app.js           # Client state, API handlers, view renderers
    └── SCJ28-square.png # Static logo asset
```

---

## Development & Execution Rules

1. **Server Execution**:
   - Quick launch script (Linux/macOS): `./run.sh` (starts server on port 2800 and opens browser automatically)
   - Quick launch script (Windows): `run.bat` or `run.cmd`
   - Direct node command: `node server.js`
   - Access web app: `http://localhost:2800`

2. **API Conventions**:
   - All REST API routes are prefixed with `/api/`.
   - `GET /api/categories` - Returns categories tree with nested projects.
   - `GET /api/tasks` - Supports query parameters: `category_id`, `project_id`, `status`, `filter` (`today`, `upcoming`, `overdue`), `search`.
   - `POST / PUT / DELETE /api/tasks` - Full CRUD with nested `subtasks` array.
   - `PATCH /api/subtasks/:id/toggle` - Checkmark toggle handler.
   - `GET /api/stats` - Total, pending, overdue, and due today counts.

3. **Design & UX Guidelines**:
   - Maintain the sharp black/white/red color scheme.
   - Ensure form input icons have `z-index: 2`, `pointer-events: none`, and proper left padding on the input text box (`padding-left: 38px`).
   - Keep code dependency-light: pure HTML5, vanilla CSS, and standard ES6 JavaScript.

---

## Author & License

- **Author**: Sidnei Correia Junior
- **License**: Open Source under the [MIT License](LICENSE) (Copyright (c) 2026 Sidnei Correia Junior)
