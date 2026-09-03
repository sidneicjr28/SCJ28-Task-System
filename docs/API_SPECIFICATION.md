# REST API Specification - SCJ28

All SCJ28 REST API routes are hosted by `server.js` and prefixed with `/api/`. All request payload and response data exchange formats use `Content-Type: application/json`.

---

## Endpoint Summary Table

| HTTP Method | Route Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Returns categories tree with nested projects | None |
| `POST` | `/api/categories` | Creates a new category | None |
| `POST` | `/api/projects` | Creates a new project under a category | None |
| `DELETE` | `/api/projects/:id` | Deletes a project and its nested tasks | None |
| `GET` | `/api/tasks` | Returns tasks list matching criteria | `category_id`, `project_id`, `status`, `filter`, `search` |
| `POST` | `/api/tasks` | Creates a new task with optional subtasks | None |
| `PUT` | `/api/tasks/:id` | Replaces/updates an existing task | None |
| `PATCH` | `/api/tasks/:id/status` | Quickly updates task status (`todo`, `in_progress`, `done`) | None |
| `DELETE` | `/api/tasks/:id` | Deletes a task and its subtasks | None |
| `PATCH` | `/api/subtasks/:id/toggle` | Toggles subtask completion (`0` <-> `1`) | None |
| `GET` | `/api/stats` | Returns aggregate system statistics | None |
| `GET` | `/api/export` | Downloads full database backup as JSON | None |
| `POST` | `/api/import` | Imports database JSON (`mode: replace` or `merge`) | None |

---

## Detailed Endpoint Specifications

### 1. Categories & Projects

#### `GET /api/categories`
- **Description**: Returns all categories sorted by ID with nested `projects` array.
- **Status Code**: `200 OK`
- **Response Example**:
```json
[
  {
    "id": 1,
    "name": "Software Engineering",
    "icon": "graduation-cap",
    "color": "#ff3333",
    "projects": [
      {
        "id": 1,
        "category_id": 1,
        "name": "Data Structures & Algorithms",
        "description": "Course CS201",
        "color": "#ff3333",
        "created_at": "2026-09-03 20:25:58"
      }
    ]
  }
]
```

#### `POST /api/categories`
- **Request Body**:
```json
{
  "name": "Personal Goals",
  "icon": "user",
  "color": "#ff3333"
}
```
- **Status Code**: `201 Created`

#### `POST /api/projects`
- **Request Body**:
```json
{
  "category_id": 1,
  "name": "Project Alpha",
  "description": "Initial setup",
  "color": "#26a269"
}
```
- **Status Code**: `201 Created`

---

### 2. Tasks & Subtasks

#### `GET /api/tasks`
- **Query Parameters**:
  - `category_id` (optional): Filter tasks under a specific category ID.
  - `project_id` (optional): Filter tasks under a specific project ID.
  - `status` (optional): `'todo'`, `'in_progress'`, or `'done'`.
  - `filter` (optional): `'today'` (due today), `'upcoming'` (due next 7 days), or `'overdue'` (due in past and not done).
  - `search` (optional): Search query string.
- **Status Code**: `200 OK`
- **Response Example**:
```json
[
  {
    "id": 10,
    "project_id": 1,
    "title": "Build Graph Algorithm Assignment",
    "description": "Dijkstra and A* implementation",
    "due_date": "2026-09-10T23:59",
    "priority": 1,
    "status": "todo",
    "created_at": "2026-09-03 20:30:00",
    "updated_at": "2026-09-03 20:30:00",
    "project_name": "Data Structures & Algorithms",
    "project_color": "#ff3333",
    "category_id": 1,
    "category_name": "Software Engineering",
    "subtasks": [
      {
        "id": 1,
        "task_id": 10,
        "title": "Implement Priority Queue",
        "completed": 1,
        "position": 0
      }
    ]
  }
]
```

#### `POST /api/tasks`
- **Request Body**:
```json
{
  "project_id": 1,
  "title": "Prepare Presentation Slides",
  "description": "Chapter 4 overview",
  "due_date": "2026-09-15T14:00",
  "priority": 2,
  "status": "todo",
  "reminder_frequency": "smart",
  "subtasks": [
    { "title": "Outline key topics", "completed": false },
    { "title": "Add diagram graphics", "completed": false }
  ]
}
```
- **Status Code**: `201 Created`

#### `PATCH /api/tasks/:id/status`
- **Request Body**:
```json
{
  "status": "done"
}
```
- **Status Code**: `200 OK`

---

### 3. Backup, Import & Export

#### `GET /api/export`
- **Description**: Exports the full SQLite database content into JSON format. Sets `Content-Disposition` attachment header for automated browser downloading.
- **Status Code**: `200 OK`
- **Response Example**:
```json
{
  "version": 1,
  "exported_at": "2026-09-03T20:37:54.624Z",
  "categories": [...],
  "projects": [...],
  "tasks": [...],
  "subtasks": [...]
}
```

#### `POST /api/import`
- **Description**: Restores or merges database content from JSON payload.
- **Request Body**:
```json
{
  "version": 1,
  "categories": [...],
  "projects": [...],
  "tasks": [...],
  "subtasks": [...],
  "mode": "replace"
}
```
- `mode` options: `'replace'` (clears existing DB and restores full state) or `'merge'` (appends new items and maps foreign keys).
- **Status Code**: `200 OK`
- **Response Example**:
```json
{
  "message": "Data imported successfully",
  "counts": {
    "categories": 4,
    "projects": 10,
    "tasks": 5,
    "subtasks": 8
  }
}
```
