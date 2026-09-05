# SCJ28 - Academic & Startup Task Manager

## Project Overview
SCJ28 is a lightweight, modern, minimalist task management web application designed for organizing academic course workloads (around 6 main classes), personal goals, and startup/work projects.

The application features a sleek dark-mode user interface, hierarchical task organization, interactive subtask checklists, 4-tier priority levels, multi-view layout modes (List, Kanban Board, Calendar), smart due date filtering, custom background image uploads, global dark opacity controls (60% to 100%), split-screen desktop responsiveness, HTML5 Web Desktop Notifications for due and overdue tasks, and full **Progressive Web App (PWA)** capabilities including offline caching, standalone app installation, and network status notifications.

---

## Tech Stack & Architecture

- **Backend**: Node.js + Express.js REST API (`server.js`)
- **Database**: SQLite3 via `better-sqlite3` (`database.js` creating `tasks.db`)
- **Storage**: `./bkg-image` subfolder for uploaded wallpaper background images
- **Frontend**: Vanilla HTML5, CSS3, and ES6 JavaScript (`public/`)
- **PWA Capabilities**: Web App Manifest (`manifest.json`), Service Worker (`sw.js`), offline shell caching, install prompt lifecycle (`pwaService.js`)
- **Icons**: Lucide Icons library (`https://unpkg.com/lucide@latest`)
- **Design System**: Minimalist Dark Mode Palette & Glassmorphic Translucency
  - **Background**: Custom uploaded wallpaper or `#0a0a0a` (Pure Black)
  - **Sidebar & Panels**: Glassmorphic blurred surfaces with customizable dark opacity (`--panel-opacity`)
  - **Cards & Elements**: 2% relative dark overlay (`--item-opacity`) for sleek glass transparency
  - **Accent Color**: `#ff3333` (Vibrant Red, customizable)
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
- `github_repo` (TEXT) e.g., `owner/repository`
- `github_project_id` (TEXT) e.g., GitHub Project (v2) ID or URL

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
- `github_issue_id` (INTEGER)
- `github_issue_number` (INTEGER)
- `github_issue_url` (TEXT)
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
├── server.js            # Express REST API server endpoints & routing (.env autoloader)
├── database.js          # SQLite connection, schema definition & default seed data
├── .env                 # Local environment configuration file
├── .env.example         # Environment variables template
├── tasks.db             # Local SQLite database file (auto-generated)
├── SCJ28-square.png     # Application logo
├── bkg-image/           # Uploaded background image storage folder
├── src/                 # Backend REST Controllers & Services
│   ├── controllers/     # Task, Category, Project, Background, Settings & GitHub controllers
│   ├── services/        # Business logic & image storage management & GitHub API integration
│   └── routes/          # Express route bindings (/api/tasks, /api/github, etc.)
└── public/
    ├── index.html       # Single-page application markup & modals
    ├── styles.css       # Black/White/Red minimalist glassmorphic CSS
    ├── manifest.json    # PWA Web App Manifest configuration
    ├── sw.js            # Service Worker for offline asset & API caching
    ├── SCJ28-square.png # Static logo asset
    ├── icons/           # High-resolution PWA icons (192x192, 512x512)
    │   ├── icon-192x192.png
    │   └── icon-512x512.png
    └── js/
        ├── app.js       # Client orchestrator entry point
        ├── services/    # API, Notification & PWA Services
        │   ├── apiService.js
        │   ├── notificationService.js
        │   └── pwaService.js
        ├── state/       # Application state store
        │   └── store.js
        ├── ui/          # Toast & Modal UI managers
        │   ├── modalManager.js
        │   └── toast.js
        └── renderers/   # Modular view renderers (List, Kanban, Calendar, GitHub, Stats, Categories)
            ├── calendarRenderer.js
            ├── categoryRenderer.js
            ├── diaryRenderer.js
            ├── githubRenderer.js
            ├── kanbanRenderer.js
            ├── listRenderer.js
            └── statsRenderer.js
```

---

## Development & Execution Rules

1. **Server Execution**:
   - Quick launch script (Linux/macOS): `./run.sh` (starts server on port 2800 and opens browser automatically)
   - Quick launch script (Windows): `run.bat` or `run.cmd`
   - Direct node command: `node server.js` (automatically loads `.env`)
   - Access web app: `http://localhost:2800` (Navbar brand: SCJ28 Task System v0.3.2)

2. **API Conventions**:
   - All REST API routes are prefixed with `/api/`.
   - `GET /api/categories` - Returns categories tree with nested projects.
   - `POST / PUT / DELETE /api/categories` - Full CRUD for categories.
   - `POST / PUT / DELETE /api/projects` - Full CRUD for projects under categories (supports `github_repo` and `github_project_id`).
   - `GET /api/github/auth` & `GET /api/github/callback` - Initiates & completes GitHub OAuth 2.0 login.
   - `GET /api/github/status` & `POST /api/github/disconnect` - Checks connection status and revokes tokens.
   - `GET /api/github/projects/:projectId/board` - Fetches live GitHub issues and board cards.
   - `POST /api/github/projects/:projectId/issues` - Quick-creates a new GitHub issue.
   - `POST /api/github/projects/:projectId/import-task` - Imports a GitHub card into local SCJ28 `tasks.db`.
   - `GET /api/settings` & `PUT /api/settings` - Fetches and saves website accent color theme in `settings.json`.
   - `GET /api/background`, `POST /api/background`, `DELETE /api/background` - Background wallpaper upload, retrieval, and removal (`bkg-image/`).
   - `GET /api/tasks` - Supports query parameters: `category_id`, `project_id`, `status`, `filter` (`today`, `upcoming`, `overdue`), `search`.
   - `POST / PUT / DELETE /api/tasks` - Full CRUD with nested `subtasks` array.
   - `PATCH /api/subtasks/:id/toggle` - Checkmark toggle handler.
   - `GET /api/stats` - Total, pending, overdue, and due today counts.

3. **PWA & Offline Features**:
   - Service worker pre-caches application shell assets on installation.
   - API GET requests utilize network-first strategy with cache fallback for offline usage.
   - PWA Install button automatically appears in top navigation when browser triggers `beforeinstallprompt`.
   - Automatic online/offline status notifications via toast UI.

4. **Design & UX Guidelines**:
   - Maintain the sharp black/white/red color scheme with glassmorphic backdrop blurring.
   - Global panel opacity slider (60%–100%) saved in `localStorage` (`scj28_panel_opacity`).
   - Inner cards and divs remain transparent with a 2% relative dark overlay.
   - Background images are stored in `./bkg-image/` and excluded from `tasks.db` and JSON backup exports.
   - Theme customization modal features a scrollable `75vh` height and responsive half-desktop split-screen layout support.
   - Ensure form input icons have `z-index: 2`, `pointer-events: none`, and proper left padding on the input text box (`padding-left: 38px`).
   - Keep code dependency-light: pure HTML5, vanilla CSS, and standard ES6 JavaScript.

---

## Author & License

- **Author**: Sidnei Correia Junior
- **License**: Open Source under the [MIT License](LICENSE) (Copyright (c) 2026 Sidnei Correia Junior)
