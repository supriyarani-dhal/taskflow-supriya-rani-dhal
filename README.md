# TaskFlow-supriya-rani-dhal

## 1. Overview

TaskFlow is a minimal but complete task management system. Users can register,
log in, create projects, add tasks to those projects, and manage them through
a Kanban-style board.

**What it does:**
- Register and log in with JWT-based authentication
- Create and manage projects
- Add tasks with status (todo / in_progress / done), priority (low / medium / high), due dates, and assignees
- Filter tasks by status on the project board
- Optimistic UI — task status changes reflect instantly without waiting for the server

**Tech Stack:**
| Layer | Technology |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| Migrations | db-migrate |
| Auth | JWT (24h) + bcrypt (cost 12) |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Server state | React Query |
| Client state | Zustand |
| Reverse proxy | Nginx |
| Infra | Docker + Docker Compose |

> **Note on Go:** The assignment suggested Go for the backend. I chose Node.js +
> TypeScript as I'm significantly more proficient in it and wanted to deliver a
> polished, fully working submission within the 72-hour window rather than a
> partial Go implementation. I'm actively learning Go.

---

## 2. Architecture Decisions

### Why Express + TypeScript over Go?
Covered above — correctness and completeness within the time constraint took
priority over language preference.

### Why React Query for server state?
React Query handles caching, background refetching, loading states, and error
states automatically. The alternative (manual `useEffect` + `useState`) produces
fragile, verbose code. React Query also makes optimistic updates straightforward,
which was a rubric requirement.

### Why Zustand for auth state?
Zustand is lightweight and has no boilerplate compared to Redux. Auth state is
simple (user + token), so a single small store is the right tool. It persists
to `localStorage` so auth survives page refreshes without any extra setup.

### Why Nginx as a reverse proxy?
Rather than exposing two ports (3000 for frontend, 8080 for backend), Nginx
serves the React app on port 3000 and forwards `/auth`, `/projects`, `/tasks`
requests to the backend container internally. This means the browser only talks
to one origin — no CORS issues in production.

### Why db-migrate with raw SQL migrations?
The assignment explicitly said "not auto-migrate or ORM magic." Raw SQL migration
files give full control over the schema and are easy for reviewers to read and
verify. Both up and down migrations are included for every file.

### Tradeoffs made
- **No pagination** — list endpoints return all records. This would be the first
  thing to add in a real product.
- **No role system** — authorization is owner-based only. A real product would
  have team members with roles.
- **Assignee is a free UUID field** — the UI doesn't have a user picker yet.
  Assignees can be set via the API but the frontend doesn't expose it fully.
- **No refresh tokens** — JWT expires in 24h and the user is logged out. A
  production system would use refresh tokens.

### Intentionally left out
- WebSocket / SSE real-time updates — would require significant extra infra
- Email verification on register — out of scope for this assignment
- Rate limiting — would add in production

---

## 3. Running Locally

> Assumes Docker and Docker Compose are installed. Nothing else is required.

```bash
git clone https://github.com/supriyarani-dhal/taskflow-supriya-rani-dhal.git
cd taskflow-supriya-rani-dhal
cp .env.example .env
docker compose up --build
```

- Frontend: **http://localhost:3000**
- API: **http://localhost:8080**

The first run will:
1. Pull the PostgreSQL image
2. Build the backend and frontend Docker images
3. Run all database migrations automatically
4. Seed the database with test data

---

## 4. Running Migrations

Migrations run **automatically** when the backend container starts via
`entrypoint.sh`. No manual steps are needed.

To run manually (outside Docker):

```bash
cd backend
cp ../.env.example .env   # fill in DB credentials pointing to a local PG instance
npm install
npm run migrate:up        # apply all migrations
npm run migrate:down      # roll back one step
```

---

## 5. Test Credentials

A seed user is created automatically on first run:

```
Email:    test@example.com
Password: password123
```

This user owns the "Demo Project" which contains 3 tasks with different statuses.

---

## 6. API Reference

Base URL: `http://localhost:8080`

All protected endpoints require:
```
Authorization: Bearer <token>
```

---

### Auth

#### POST `/auth/register`
```json
// Request
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}

// Response 201
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "created_at": "2026-04-01T10:00:00Z"
  }
}

// Response 400 (validation error)
{
  "error": "validation failed",
  "fields": { "email": "already exists" }
}
```

#### POST `/auth/login`
```json
// Request
{ "email": "jane@example.com", "password": "password123" }

// Response 200
{
  "token": "<jwt>",
  "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" }
}

// Response 401
{ "error": "invalid credentials" }
```

---

### Projects

#### GET `/projects` 🔒
```json
// Response 200
{
  "projects": [
    {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Q2 project",
      "owner_id": "uuid",
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

#### POST `/projects` 🔒
```json
// Request
{ "name": "New Project", "description": "Optional" }

// Response 201
{
  "id": "uuid",
  "name": "New Project",
  "description": "Optional",
  "owner_id": "uuid",
  "created_at": "2026-04-09T10:00:00Z"
}

// Response 400
{ "error": "validation failed", "fields": { "name": "is required" } }
```

#### GET `/projects/:id` 🔒
```json
// Response 200
{
  "id": "uuid",
  "name": "Website Redesign",
  "description": "Q2 project",
  "owner_id": "uuid",
  "created_at": "2026-04-01T10:00:00Z",
  "tasks": [
    {
      "id": "uuid",
      "title": "Design homepage",
      "description": "Mobile-first",
      "status": "in_progress",
      "priority": "high",
      "project_id": "uuid",
      "assignee_id": null,
      "due_date": "2026-04-15",
      "created_at": "2026-04-01T10:00:00Z",
      "updated_at": "2026-04-01T10:00:00Z"
    }
  ]
}

// Response 404
{ "error": "not found" }
```

#### PATCH `/projects/:id` 🔒
```json
// Request (all fields optional)
{ "name": "Updated Name", "description": "Updated description" }

// Response 200 — returns updated project object
// Response 403
{ "error": "forbidden" }
```

#### DELETE `/projects/:id` 🔒
```
// Response 204 No Content
// Response 403 — if not the owner
```

---

### Tasks

#### GET `/projects/:id/tasks?status=todo&assignee=uuid` 🔒
```json
// Response 200
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Design homepage",
      "status": "todo",
      "priority": "high",
      "project_id": "uuid",
      "assignee_id": null,
      "due_date": null,
      "created_at": "2026-04-01T10:00:00Z",
      "updated_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

#### POST `/projects/:id/tasks` 🔒
```json
// Request
{
  "title": "Design homepage",
  "description": "Mobile-first design",
  "priority": "high",
  "assignee_id": "uuid",
  "due_date": "2026-04-15"
}

// Response 201 — returns created task object
// Response 400
{ "error": "validation failed", "fields": { "title": "is required" } }
```

#### PATCH `/tasks/:id` 🔒
```json
// Request (all fields optional)
{
  "title": "Updated title",
  "status": "done",
  "priority": "low",
  "assignee_id": "uuid",
  "due_date": "2026-04-20"
}

// Response 200 — returns updated task object
// Response 404
{ "error": "not found" }
```

#### DELETE `/tasks/:id` 🔒
```
// Response 204 No Content
// Response 403 — if not the project owner
```

#### GET `/users` 🔒
```json
// Request
[
  {
    "email": "jane@example.com"
    "id": "d94eeb7e-88d1-47ab-ab41-09fadec876d2"
    "name": "Jane Doe"
  }
]
```


---

### Error responses (all endpoints)

```json
// 400 Validation error
{ "error": "validation failed", "fields": { "email": "is required" } }

// 401 Unauthenticated
{ "error": "unauthorized" }

// 403 Forbidden (authenticated but not allowed)
{ "error": "forbidden" }

// 404 Not found
{ "error": "not found" }
```

---

## 7. What I'd Do With More Time

### Shortcuts I took
- **Assignee UI is incomplete** — the task modal doesn't let you pick a user
  from a list. The API supports it, but the frontend has no user search.
- **No input sanitization beyond basic validation** — a production app would
  sanitize all inputs more rigorously.
- **Error boundaries missing in React** — unhandled render errors would crash
  the whole page instead of showing a graceful error message.
- **No tests** — I skipped tests to stay within the time limit. This is the
  biggest shortcut.

### What I'd add
- **Integration tests** for auth and task endpoints (Jest + Supertest)
- **Pagination** on `/projects` and `/tasks` endpoints
- **Drag-and-drop** to move tasks between Kanban columns (react-beautiful-dnd)
- **Real-time updates** via WebSocket so multiple users see changes live
- **Dark mode** toggle persisted to localStorage
- **Refresh tokens** so users aren't logged out after 24 hours
- **User search / assignee picker** in the task modal
- **Project stats endpoint** — task counts by status and by assignee
- **Rate limiting** on auth endpoints to prevent brute force