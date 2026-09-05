# REST API Specification - SCJ28 (v0.3.2)

All SCJ28 REST API routes are hosted by `server.js` and prefixed with `/api/`. All request payload and response data exchange formats use `Content-Type: application/json`.

---

## Endpoint Summary Table

| HTTP Method | Route Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Returns categories tree with nested projects | None |
| `POST` | `/api/categories` | Creates a new category | None |
| `PUT` | `/api/categories/:id` | Updates an existing category | None |
| `DELETE` | `/api/categories/:id` | Deletes a category and its nested projects, tasks & diaries | None |
| `POST` | `/api/projects` | Creates a new project under a category | None |
| `PUT` | `/api/projects/:id` | Updates an existing project | None |
| `DELETE` | `/api/projects/:id` | Deletes a project and its nested tasks & diaries | None |
| `GET` | `/api/settings` | Returns app configuration & accent color from `settings.json` | None |
| `PUT` | `/api/settings` | Updates app configuration & accent color in `settings.json` | None |
| `GET` | `/api/background` | Returns uploaded background wallpaper URL | None |
| `POST` | `/api/background` | Uploads a new background image (`bkg-image/`) | None |
| `DELETE` | `/api/background` | Removes the current background image | None |
| `GET` | `/api/tasks` | Returns tasks list matching criteria | `category_id`, `project_id`, `status`, `filter`, `search` |
| `POST` | `/api/tasks` | Creates a new task with optional subtasks | None |
| `PUT` | `/api/tasks/:id` | Replaces/updates an existing task | None |
| `PATCH` | `/api/tasks/:id/status` | Quickly updates task status (`todo`, `in_progress`, `done`) | None |
| `DELETE` | `/api/tasks/:id` | Deletes a task and its subtasks | None |
| `PATCH` | `/api/subtasks/:id/toggle` | Toggles subtask completion (`0` <-> `1`) | None |
| `GET` | `/api/diaries` | Returns diary entries matching filters | `category_id`, `project_id`, `search` |
| `GET` | `/api/diaries/:id` | Returns a single diary entry by ID with attached tasks | None |
| `POST` | `/api/diaries` | Creates a new diary entry with optional attached task IDs | None |
| `PUT` | `/api/diaries/:id` | Updates an existing diary entry | None |
| `DELETE` | `/api/diaries/:id` | Deletes a diary entry and its task links | None |
| `POST` | `/api/diaries/upload-image` | Uploads a pasted image file to `./uploads/diary-images/` | None |
| `GET` | `/api/stats` | Returns aggregate system statistics | None |
| `GET` | `/api/export` | Downloads full database & settings backup as JSON | None |
| `POST` | `/api/import` | Imports database & settings JSON (`mode: replace` or `merge`) | None |
| `GET` | `/api/github/auth` | Initiates GitHub OAuth 2.0 authorization redirect | None |
| `GET` | `/api/github/callback` | Handles OAuth 2.0 code exchange callback | `code` |
| `GET` | `/api/github/status` | Checks GitHub connection & user profile status | None |
| `POST` | `/api/github/disconnect` | Revokes stored GitHub access token | None |
| `POST` | `/api/github/config` | Saves GitHub OAuth Client ID & Secret | None |
| `GET` | `/api/github/projects/:projectId/board` | Fetches live GitHub issues and board cards | None |
| `POST` | `/api/github/projects/:projectId/issues` | Quick-creates a new issue in the linked repository | None |
| `POST` | `/api/github/projects/:projectId/import-task` | Imports a GitHub issue card into local SCJ28 `tasks.db` | None |

---

## Detailed Endpoint Specifications

### 1. Project & Class Diaries Subsystem

#### `GET /api/diaries`
- **Query Parameters**:
  - `category_id` (optional): Filter entries by Category ID.
  - `project_id` (optional): Filter entries by Project ID.
  - `search` (optional): Full-text search string across title or Markdown content.
- **Status Code**: `200 OK`
- **Response Example**:
```json
[
  {
    "id": 1,
    "project_id": 2,
    "category_id": 1,
    "title": "Lecture 4 Notes - Binary Search Trees",
    "content": "# BST Insertion Algorithms\n- Left child < Parent\n- Right child > Parent",
    "created_at": "2026-09-04 14:00:00",
    "updated_at": "2026-09-04 14:30:00",
    "project_name": "Data Structures & Algorithms",
    "project_color": "#ff3333",
    "category_name": "Academic",
    "attached_tasks": [
      {
        "id": 12,
        "title": "Implement AVL Rotation Code",
        "status": "in_progress",
        "priority": 1,
        "due_date": "2026-09-10T23:59"
      }
    ]
  }
]
```

#### `POST /api/diaries`
- **Request Body**:
```json
{
  "project_id": 2,
  "category_id": 1,
  "title": "Sprint 2 Retrospective",
  "content": "### What went well\n- Fast REST API response times\n\n![pasted image](/uploads/diary-images/diary_1788500240185_a1b2c3.png)",
  "task_ids": [12, 14]
}
```
- **Status Code**: `201 Created`

#### `POST /api/diaries/upload-image`
- **Description**: Uploads a base64 encoded pasted image file and saves it in `./uploads/diary-images/`.
- **Request Body**:
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "name": "screenshot.png"
}
```
- **Status Code**: `200 OK`
- **Response Example**:
```json
{
  "fileName": "diary_1788500240185_a1b2c3.png",
  "url": "/uploads/diary-images/diary_1788500240185_a1b2c3.png"
}
```

---

### 2. Backup, Import & Export

#### `GET /api/export`
- **Description**: Exports categories, projects, tasks, subtasks, diaries, diary_tasks, and settings into JSON format.
- **Status Code**: `200 OK`
- **Response Example**:
```json
{
  "version": 2,
  "exported_at": "2026-09-04T15:00:00.000Z",
  "categories": [...],
  "projects": [...],
  "tasks": [...],
  "subtasks": [...],
  "diaries": [...],
  "diary_tasks": [...]
}
```

#### `POST /api/import`
- **Description**: Restores or merges database content from JSON payload.
- **Request Body**:
```json
{
  "version": 2,
  "categories": [...],
  "projects": [...],
  "tasks": [...],
  "subtasks": [...],
  "diaries": [...],
  "diary_tasks": [...],
  "mode": "replace"
}
```
- **Status Code**: `200 OK`
