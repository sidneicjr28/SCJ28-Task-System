# Class Diagram & System Class & Data Architecture Diagram - SCJ28 (v0.3.2)

This document presents structural diagrams, database entity-relationship models, UML class representations, and client state contracts for SCJ28.

---

## 1. Database Entity-Relationship Diagram (ERD)

The diagram below illustrates the SQLite database schema relationships managed by `database.js` and `better-sqlite3`.

```mermaid
erDiagram
    CATEGORIES ||--o{ PROJECTS : "has many (1:N, ON DELETE CASCADE)"
    PROJECTS ||--o{ TASKS : "has many (1:N, ON DELETE CASCADE)"
    TASKS ||--o{ SUBTASKS : "has many (1:N, ON DELETE CASCADE)"
    PROJECTS ||--o{ DIARIES : "has many (1:N, ON DELETE CASCADE)"
    CATEGORIES ||--o{ DIARIES : "has many (1:N, ON DELETE CASCADE)"
    DIARIES ||--o{ DIARY_TASKS : "has many (1:N, ON DELETE CASCADE)"
    TASKS ||--o{ DIARY_TASKS : "has many (1:N, ON DELETE CASCADE)"

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

    DIARIES {
        int id PK "AUTOINCREMENT"
        int project_id FK "NULLABLE"
        int category_id FK "NULLABLE"
        string title "NOT NULL"
        string content "Markdown text"
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
        datetime updated_at "DEFAULT CURRENT_TIMESTAMP"
    }

    DIARY_TASKS {
        int diary_id PK, FK "NOT NULL"
        int task_id PK, FK "NOT NULL"
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
    }

    class DiaryController {
        +getDiaries(req, res): void
        +getDiaryById(req, res): void
        +createDiary(req, res): void
        +updateDiary(req, res): void
        +deleteDiary(req, res): void
        +uploadImage(req, res): void
    }

    class BackupController {
        +exportBackup(req, res): void
        +importBackup(req, res): void
    }

    class TaskService {
        +getTasks(filters): Task[]
        +createTask(data): Task
        +updateTask(id, data): Task
    }

    class DiaryService {
        +getDiaries(filters): Diary[]
        +createDiary(data): Diary
        +updateDiary(id, data): Diary
        +saveUploadedImage(base64Data, originalName): object
    }

    class BackupService {
        +exportData(): BackupJSON
        +importData(payload): ImportResult
    }

    class TaskRepository {
        +findFiltered(filters): Task[]
        +create(data): int
        +update(id, data): void
    }

    class DiaryRepository {
        +findFiltered(filters): Diary[]
        +create(data): Diary
        +setAttachedTasks(diaryId, taskIds): void
    }

    ExpressServer --> ApiRouter : mounts
    ApiRouter --> TaskController
    ApiRouter --> DiaryController
    ApiRouter --> BackupController

    TaskController --> TaskService : delegates
    DiaryController --> DiaryService : delegates
    BackupController --> BackupService : delegates

    TaskService --> TaskRepository : uses
    DiaryService --> DiaryRepository : uses
```

---

## 3. Client State Management Object Schema

In `public/js/state/store.js`, the central application state is held within a single reactive `Store` instance:

```typescript
interface ClientState {
  categories: CategoryWithProjects[];
  tasks: TaskWithSubtasks[];
  diaries: DiaryWithAttachedTasks[];
  stats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    dueToday: number;
  };
  activeFilter: 'all' | 'today' | 'upcoming' | 'overdue' | 'diaries';
  activeCategory: number | null;
  activeProject: number | null;
  activeTab: 'tasks' | 'diaries';
  currentView: 'list' | 'kanban' | 'calendar';
  searchQuery: string;
  filterStatus: string;
  filterPriority: string;
  calendarDate: Date;
  editingTaskId: number | null;
  editingDiaryId: number | null;
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
    "version": { "type": "integer", "default": 2 },
    "exported_at": { "type": "string", "format": "date-time" },
    "categories": { "type": "array" },
    "projects": { "type": "array" },
    "tasks": { "type": "array" },
    "subtasks": { "type": "array" },
    "diaries": { "type": "array" },
    "diary_tasks": { "type": "array" }
  }
}
```
