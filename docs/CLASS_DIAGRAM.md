# Class Diagram & System Architecture Models - SCJ28

This document presents structural diagrams, database entity-relationship models, UML class representations, and client state contracts for SCJ28.

---

## 1. Database Entity-Relationship Diagram (ERD)

The diagram below illustrates the SQLite database schema relationships managed by `database.js` and `better-sqlite3`.

```mermaid
erDiagram
    CATEGORIES ||--o{ PROJECTS : "has many (1:N, ON DELETE CASCADE)"
    PROJECTS ||--o{ TASKS : "has many (1:N, ON DELETE CASCADE)"
    TASKS ||--o{ SUBTASKS : "has many (1:N, ON DELETE CASCADE)"

    CATEGORIES {
        int id PK "AUTOINCREMENT"
        string name "NOT NULL UNIQUE"
        string icon "DEFAULT 'folder'"
        string color "DEFAULT '#ff3333'"
    }

    PROJECTS {
        int id PK "AUTOINCREMENT"
        int category_id FK "NOT NULL"
        string name "NOT NULL"
        string description
        string color "DEFAULT '#ffffff'"
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    TASKS {
        int id PK "AUTOINCREMENT"
        int project_id FK "NOT NULL"
        string title "NOT NULL"
        string description
        string due_date "ISO Format YYYY-MM-DDTHH:mm"
        int priority "1: P1, 2: P2, 3: P3, 4: P4"
        string status "'todo' | 'in_progress' | 'done'"
        string reminder_frequency "'smart' | 'hourly' | 'every_3h' | 'twice_daily' | 'daily' | 'due_only' | 'none'"
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
        datetime updated_at "DEFAULT CURRENT_TIMESTAMP"
    }

    SUBTASKS {
        int id PK "AUTOINCREMENT"
        int task_id FK "NOT NULL"
        string title "NOT NULL"
        int completed "0 or 1"
        int position "Ordering index"
    }
```

---

## 2. Server & Client Layered Architecture UML Class Diagram

The class diagram below displays the S.O.L.I.D decoupled layered architecture (Controller -> Service -> Repository -> Database) and client ES6 module components.

```mermaid
classDiagram
    class ExpressServer {
        +app: Express
        +PORT: number = 2800
    }

    class ApiRouter {
        +router: Router
    }

    class CategoryController {
        +getCategories(req, res): void
        +createCategory(req, res): void
    }

    class ProjectController {
        +createProject(req, res): void
        +deleteProject(req, res): void
    }

    class TaskController {
        +getTasks(req, res): void
        +createTask(req, res): void
        +updateTask(req, res): void
        +patchStatus(req, res): void
        +deleteTask(req, res): void
        +toggleSubtask(req, res): void
    }

    class BackupController {
        +exportBackup(req, res): void
        +importBackup(req, res): void
    }

    class StatsController {
        +getStats(req, res): void
    }

    class TaskService {
        +getTasks(filters): Task[]
        +createTask(data): Task
        +updateTask(id, data): Task
        +updateTaskStatus(id, status): object
        +deleteTask(id): void
        +toggleSubtask(id): object
    }

    class BackupService {
        +exportData(): BackupJSON
        +importData(payload): ImportResult
    }

    class StatsService {
        +getStats(): StatsObject
    }

    class CategoryRepository {
        +findAll(): Category[]
        +create(data): Category
    }

    class ProjectRepository {
        +findAll(): Project[]
        +create(data): Project
        +delete(id): void
    }

    class TaskRepository {
        +findFiltered(filters): Task[]
        +create(data): int
        +update(id, data): void
        +updateStatus(id, status): void
        +delete(id): void
    }

    class SubtaskRepository {
        +findByTaskId(taskId): Subtask[]
        +create(taskId, title, completed, position): void
        +toggle(id): Subtask
    }

    ExpressServer --> ApiRouter : mounts
    ApiRouter --> CategoryController
    ApiRouter --> ProjectController
    ApiRouter --> TaskController
    ApiRouter --> BackupController
    ApiRouter --> StatsController

    TaskController --> TaskService : delegates
    BackupController --> BackupService : delegates
    StatsController --> StatsService : delegates

    CategoryController --> CategoryRepository : uses
    ProjectController --> ProjectRepository : uses
    TaskService --> TaskRepository : uses
    TaskService --> SubtaskRepository : uses
```

---

## 3. Client State Management Object Schema

In `public/js/state/store.js`, the central application state is held within a single reactive `Store` instance:

```typescript
interface ClientState {
  categories: CategoryWithProjects[];
  tasks: TaskWithSubtasks[];
  stats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    dueToday: number;
  };
  activeFilter: 'all' | 'today' | 'upcoming' | 'overdue';
  activeCategory: number | null;
  activeProject: number | null;
  currentView: 'list' | 'kanban' | 'calendar';
  searchQuery: string;
  filterStatus: string;
  filterPriority: string;
  calendarDate: Date;
  editingTaskId: number | null;
}
```

---

## 4. Import / Export Data Contract

The JSON schema contract produced by `GET /api/export` and accepted by `POST /api/import` is defined as:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "version": { "type": "integer", "default": 1 },
    "exported_at": { "type": "string", "format": "date-time" },
    "categories": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "name": { "type": "string" },
          "icon": { "type": "string" },
          "color": { "type": "string" }
        },
        "required": ["name"]
      }
    },
    "projects": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "category_id": { "type": "integer" },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "color": { "type": "string" }
        },
        "required": ["category_id", "name"]
      }
    },
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "project_id": { "type": "integer" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "due_date": { "type": ["string", "null"] },
          "priority": { "type": "integer" },
          "status": { "type": "string" }
        },
        "required": ["project_id", "title"]
      }
    },
    "subtasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "task_id": { "type": "integer" },
          "title": { "type": "string" },
          "completed": { "type": "integer" },
          "position": { "type": "integer" }
        },
        "required": ["task_id", "title"]
      }
    }
  }
}
```
