# SCJ28 Developer Documentation

Welcome to the **SCJ28 Developer Documentation** (v0.3.1). This documentation suite provides technical specifications, operational architecture, system requirements, use case specifications, and structural diagrams to help developers understand, maintain, and extend the SCJ28 Task & Diary Management platform.

---

## 📚 Documentation Index

1. [**Requirements Specification (`REQUIREMENTS.md`)**](./REQUIREMENTS.md)
   - Functional requirements (Task management, Smart filtering, Project & Class Diaries, Clipboard Image Uploads, Compact Card Expansion, Import/Export, Desktop Notifications).
   - Non-functional requirements (Performance, Storage, Security, UI Design System).

2. [**Use Cases & User Flows (`USE_CASES.md`)**](./USE_CASES.md)
   - Detailed use cases including Preconditions, Primary Success Flows, Alternate Flows, and Postconditions.

3. [**Class Diagram & System Models (`CLASS_DIAGRAM.md`)**](./CLASS_DIAGRAM.md)
   - Database Entity-Relationship Diagram (ERD).
   - Client ES6 Architecture & State Flow Diagram.
   - Class and Data Contracts.

4. [**REST API Specification (`API_SPECIFICATION.md`)**](./API_SPECIFICATION.md)
   - Complete documentation of `/api/` HTTP REST endpoints, request/response JSON schemas, query filters, and status codes.

---

## 🚀 Quick Technical Overview

SCJ28 is a lightweight, zero-build single-page web application built with a decoupled REST backend and a reactive vanilla JavaScript frontend.

### System Stack
- **Backend Runtime**: Node.js + Express.js
- **Database**: SQLite3 via `better-sqlite3` (file-backed at `tasks.db` with WAL support)
- **Image Storage**: `./uploads/diary-images/` for pasted markdown screenshots & `./bkg-image/` for wallpaper background images
- **Frontend Engine**: Vanilla HTML5, CSS3 Variables, ES6 JavaScript (`public/`)
- **Markdown Engine**: `marked.js` with GFM task list & line breaks support
- **Icons**: Lucide Icon Set
- **Design System**: Minimalist Dark Mode (`#0a0a0a` background, `#ff3333` accent highlight, glassmorphism panel opacity)

### Project Directory Layout
```
SCJ28/
├── server.js              # Express API server entry point & static routes
├── database.js            # SQLite database connection, schema & migrations
├── tasks.db               # SQLite database storage file
├── run.sh                 # Unix bash launcher script
├── run.bat                # Windows batch launcher script
├── uploads/               # Uploaded static assets (diary-images/)
├── bkg-image/             # Uploaded background images
├── src/                   # Backend SOLID Architecture
│   ├── controllers/       # HTTP Request/Response Controllers (Task, Diary, Category, Project, Backup, Stats, Settings)
│   ├── services/          # Business Logic & Transaction Services (Task, Diary, Backup, Stats, Settings)
│   ├── repositories/      # Data Access Layer & SQLite Repositories (Task, Diary, Category, Project, Subtask)
│   └── routes/            # Express Router Endpoint Definitions (/api/tasks, /api/diaries, etc.)
├── docs/                  # Developer documentation suite
│   ├── README.md          # Master documentation index (this file)
│   ├── REQUIREMENTS.md    # Software Requirements Specification (SRS)
│   ├── USE_CASES.md       # Complete use cases and functional flows
│   ├── CLASS_DIAGRAM.md   # ERD, UML Class Diagrams, and State Diagrams
│   └── API_SPECIFICATION.md # Full REST API endpoint reference
└── public/                # Frontend ES6 Modular Architecture
    ├── index.html         # SPA markup & modal definitions
    ├── styles.css         # Minimalist dark theme stylesheet
    └── js/                # Modular ES6 JavaScript
        ├── state/         # Centralized Reactive Store
        ├── services/      # REST API Client & Desktop Notification Engine
        ├── ui/            # Modal & Toast Managers
        ├── renderers/     # Component View Renderers (List, Kanban, Calendar, Diary, Tree, Stats)
        └── app.js         # Frontend Orchestrator & Event Listener Bootstrap
```

---

## 🛠️ Environment Setup & Execution

### Prerequisites
- Node.js version 18.x or higher
- npm package manager

### Launching the Application
```bash
# Option A (Linux/macOS): Execute bash launcher script
./run.sh

# Option B (Windows): Double click or run batch launcher script
run.bat

# Option C: Run Node server directly
node server.js
```
Access the application at `http://localhost:2800`.

---

## 📜 Author & Open Source License

- **Author**: Sidnei Correia Junior
- **License**: Open Source under the [MIT License](../LICENSE)
- **Copyright**: Copyright (c) 2026 Sidnei Correia Junior
