# taskflow-supriya-rani-dhal

> A minimal but complete task management system — Full Stack Take-Home Project

![Go](https://img.shields.io/badge/Go-1.22-00ADD8?style=flat&logo=go) ![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)

---

## 1. Overview

TaskFlow is a minimal but complete task management system. Users can register, log in, create projects, add tasks within those projects, and assign tasks to themselves or other users.

### What It Does

- **Authentication** — Secure register/login with JWT-based sessions (24h expiry)
- **Projects** — Create, update, delete projects; scoped to projects you own or are assigned in
- **Tasks** — Full lifecycle management with status, priority, assignee, and due date
- **Filtering** — Filter tasks by `status` or `assignee` within a project
- **Authorization** — Ownership checks on all mutations (403 vs 401 are never conflated)

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Go 1.22 + Gin | Fast, typed, minimal overhead |
| Database | PostgreSQL 16 | Relational integrity, UUID support |
| Migrations | Goose | Clean up/down, SQL-first |
| Auth | JWT (golang-jwt) | Stateless, simple, 24h expiry |
| Frontend | React 18 + TypeScript | Type-safe, modern DX |
| Server State | React Query | Fetching, caching, invalidation |
| Client State | Zustand | Lightweight auth state |
| UI Library | shadcn/ui + Tailwind | Accessible, composable components |
| Containers | Docker + Compose | One-command setup |

---

## 2. Architecture Decisions

### Backend Structure

The backend follows a layered architecture inside the `internal/` package:

```
backend/
├── cmd/api/main.go          # Entry point — wires deps, routes, graceful shutdown
├── internal/
│   ├── auth/                # JWT generation & validation
│   ├── handlers/            # Thin HTTP handlers — validate input, return JSON
│   ├── middleware/          # Auth guard as composable Gin middleware
│   ├── models/              # Plain Go structs mirroring DB schema
│   └── db/                  # pgxpool connection helper
└── migrations/              # Goose SQL migration files
```

### Why Raw SQL Instead of an ORM

I deliberately avoided GORM. Raw SQL with `pgx` gives full visibility into query performance, makes N+1 problems obvious, and keeps the data layer predictable. For a project of this scope, the verbosity tradeoff is worthwhile.

### Why Gin

Gin provides routing groups, middleware, and request binding without imposing opinions. It can be migrated to stdlib `net/http` + `chi` in a future pass with minimal effort.

### Frontend State Strategy

**React Query** manages all server state (fetching, caching, invalidation). **Zustand** manages the thin client-side auth state (token + user, persisted in localStorage). This avoids the trap of putting server data into a global Redux store.

### Intentional Omissions & Tradeoffs

| Omission | Reason |
|----------|--------|
| Refresh tokens | 24h JWT expiry is acceptable for a demo |
| Role-based access control | Ownership checks cover the required cases |
| Rate limiting | Would add — skipped for time |
| Email verification | Out of scope for this assignment |
| Unit tests on every handler | Integration tests cover the critical paths |
| WebSocket real-time | Listed as bonus; skipped to ship core features well |

---

## 3. Running Locally

The only prerequisite is **Docker Desktop** (or Docker Engine + Compose plugin). No Go, Node, or PostgreSQL installation required on the host.

```bash
# 1. Clone the repository
git clone https://github.com/supriya-rani-dhal/taskflow
cd taskflow

# 2. Copy environment file (defaults work out of the box)
cp .env.example .env

# 3. Start all services
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend (React) | http://localhost:3000 |
| Backend API (Go) | http://localhost:8080 |

`docker compose up` will automatically:
- Start PostgreSQL and wait for the healthcheck to pass
- Build the Go binary using a multi-stage Dockerfile
- Run all database migrations on API startup via Goose
- Seed the database with a test user, project, and 3 tasks
- Build the React app and serve it via nginx on port 3000

---

## 4. Running Migrations

Migrations run **automatically on container startup**. No manual step is needed under normal circumstances.

If you need to run migrations manually against a local Postgres instance:

```bash
# Install Goose
go install github.com/pressly/goose/v3/cmd/goose@latest

# Run all migrations up
goose -dir backend/migrations postgres \
  "postgres://taskflow:taskflow_secret@localhost:5432/taskflow?sslmode=disable" up

# Roll back one migration
goose -dir backend/migrations postgres \
  "postgres://taskflow:taskflow_secret@localhost:5432/taskflow?sslmode=disable" down
```

Migration files in `backend/migrations/`:

```
001_create_users.sql
002_create_projects.sql
003_create_tasks.sql
004_seed.sql
```

---

## 5. Test Credentials

A seed user is created automatically on first startup. Use these to log in immediately without registering:

```
Email:    test@example.com
Password: password123
```

The seed also creates:
- **1 project**: "Demo Project"
- **3 tasks** with different statuses: `done`, `in_progress`, and `todo`

---

## 6. API Reference

**Base URL:** `http://localhost:8080`

All endpoints except `/auth/*` require the header:
```
Authorization: Bearer <token>
```

---

### Authentication

#### `POST /auth/register`

```json
// Request
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}

// Response 201
{
  "token": "<jwt_access_token>",
  "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" }
}
```

#### `POST /auth/login`

```json
// Request
{ "email": "jane@example.com", "password": "securepassword123" }

// Response 200
{
  "token": "<jwt_access_token>",
  "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" }
}
```

---

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List projects the current user owns or has tasks in |
| POST | `/projects` | Create a project (owner = current user) |
| GET | `/projects/:id` | Get project details + its tasks |
| PATCH | `/projects/:id` | Update name/description (owner only) |
| DELETE | `/projects/:id` | Delete project and all its tasks (owner only) |

#### `POST /projects`

```json
// Request
{ "name": "Website Redesign", "description": "Q2 project" }

// Response 201
{
  "id": "uuid",
  "name": "Website Redesign",
  "description": "Q2 project",
  "owner_id": "uuid",
  "created_at": "2026-04-12T10:00:00Z"
}
```

#### `GET /projects/:id`

```json
// Response 200
{
  "id": "uuid",
  "name": "Website Redesign",
  "description": "Q2 project",
  "owner_id": "uuid",
  "tasks": [
    {
      "id": "uuid",
      "title": "Design homepage",
      "status": "in_progress",
      "priority": "high",
      "assignee_id": "uuid",
      "due_date": "2026-05-01",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/:id/tasks` | List tasks — supports `?status=` and `?assignee=` filters |
| POST | `/projects/:id/tasks` | Create a task |
| PATCH | `/tasks/:id` | Update task fields |
| DELETE | `/tasks/:id` | Delete task (project owner or task creator only) |

#### `POST /projects/:id/tasks`

```json
// Request
{
  "title": "Design homepage",
  "description": "Create wireframes and mockups",
  "priority": "high",
  "assignee_id": "uuid",
  "due_date": "2026-05-01"
}

// Response 201 — returns created task object
```

#### `PATCH /tasks/:id`

```json
// Request (all fields optional)
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "done",
  "priority": "low",
  "assignee_id": "uuid",
  "due_date": "2026-05-15"
}

// Response 200 — returns updated task object
```

---

### Error Responses

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

### Shortcuts Taken

- **No pagination** on list endpoints — would add `?page=&limit=` with a `total` count in the response envelope
- **localStorage for JWT** — HttpOnly cookies are more secure for production; used localStorage for simplicity here
- **CORS allows all origins** in development — should be locked down to specific origins in production
- **No request/trace IDs** in logs — would add middleware to inject these for easier debugging
- **Handler tests are integration-level only** — unit tests for individual functions are missing

### What I Would Improve

- Add `GET /projects/:id/stats` — task counts grouped by status and by assignee
- Implement refresh token rotation alongside the 24h access token
- Add optimistic UI updates for task status changes (drag-and-drop Kanban board)
- Set up a CI pipeline (GitHub Actions) for lint, test, and Docker build on every PR
- Add rate limiting on `/auth/*` endpoints to prevent brute force attacks
- Write a proper integration test suite using `testcontainers-go` for isolated Postgres per test run
- Introduce structured error types in Go instead of returning plain strings

### If This Were a Real Product

- Replace JWT-only auth with OAuth2 (Google/GitHub) for easier onboarding
- Add email notifications for task assignments and approaching due dates
- Build out team/organisation support — projects shared across a workspace
- Add real-time collaboration via WebSockets for live task updates
- Instrument with OpenTelemetry for distributed tracing and metrics

---

*Built as part of a Full Stack Engineering take-home assignment.*
