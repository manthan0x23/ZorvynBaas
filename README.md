# Zorvyn BaaS

A production-grade financial records API with cookie-based session authentication, RBAC, and dashboard analytics.

Built with **Express 5**, **TypeScript**, **Drizzle ORM**, and **PostgreSQL**.

---

## Quick Start

```bash
# Clone and install
pnpm install

# Copy environment file and fill in values
cp .env.example .env

# Start PostgreSQL, run migrations, seed users, start dev server
pnpm db:up && pnpm db:migrate && pnpm db:seed && pnpm dev
```

Or run everything with Docker:

```bash
docker-compose up --build
```

API: `http://localhost:3000`  
Swagger UI: `http://localhost:3000/api/docs`

---

## Default Credentials

| Username   | Password      | Role      |
| ---------- | ------------- | --------- |
| `admin1`   | `password123` | `admin`   |
| `analyst1` | `password123` | `analyst` |
| `viewer1`  | `password123` | `viewer`  |

---

## Tech Stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Runtime          | Node.js ≥ 20                        |
| Language         | TypeScript 6                        |
| Framework        | Express 5                           |
| Database         | PostgreSQL (via `pg` / `postgres`)  |
| ORM              | Drizzle ORM 0.45                    |
| Validation       | Zod 4                               |
| Password hashing | Argon2                              |
| Session storage  | PostgreSQL (cookie-based, HttpOnly) |
| API docs         | Swagger UI + swagger-jsdoc          |
| Package manager  | pnpm 10                             |

---

## Project Structure

```
src/
├── app.ts                  # Express app entry point
├── env.ts                  # Validated environment config
├── routers/                # Route definitions
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── record.routes.ts
│   └── dashboard.routes.ts
├── handlers/               # Request/response layer
├── services/               # Business logic
├── repos/                  # Database queries (Drizzle)
├── middlewares/            # authenticate, authorize, validate, rate-limiter, etc.
├── validators/             # Zod schemas
├── lib/                    # Shared utilities (errors, logger, hash, ctx, etc.)
├── docs/                   # Swagger JSDoc annotations
└── db/
    ├── schema/             # Drizzle table definitions
    ├── migrate.ts          # Migration runner
    ├── seeds/              # Seed scripts
    └── postgres/           # docker-compose.yml for local PostgreSQL
```

---

## Authentication

Sessions are cookie-based. On login (or register), the server sets an HttpOnly `session_id` cookie that is sent automatically with every subsequent request. No `Authorization` header is required.

See [SETUP.md](./docs/SETUP.md) for environment configuration and [API_DOC.md](./docs/API_DOC.md) for the full endpoint reference.

---

## Testing

The project includes minimal end-to-end tests built with [Vitest](https://vitest.dev/) and [Supertest](https://github.com/ladjs/supertest).

```bash
pnpm test
```

The global setup automatically runs migrations and seeds test users before the suite, then truncates all tables on teardown. `pnpm db:up` provisions the test database (configured in `.env.test`) alongside the main one — no extra steps needed.

**Coverage:**

| Suite             | What it tests                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Login             | Returns 200, sets `HttpOnly`/`SameSite=Lax` session cookie, omits `hashedPassword` from response                        |
| Rate limiting     | `429 TOO_MANY_LOGIN_ATTEMPTS` after 6 rapid failed login attempts                                                       |
| Schema validation | Invalid username on register → `422 VALIDATION_ERROR` with field-level errors; missing fields on record creation → same |
| Authorization     | `viewer` role cannot create records → `403 FORBIDDEN`                                                                   |
| Soft delete       | Create → delete → fetch by ID returns `404 NOT_FOUND`                                                                   |

---

## Documentation

| File                              | Description                                          |
| --------------------------------- | ---------------------------------------------------- |
| [API_DOC.md](./docs/API_DOC.md)   | Full endpoint reference with request/response shapes |
| [FEATURES.md](./docs/FEATURES.md) | Feature overview                                     |
| [SETUP.md](./docs/SETUP.md)       | Installation and configuration guide                 |
| `/api/docs`                       | Interactive Swagger UI (when server is running)      |

---

## Development

```bash
pnpm dev          # hot-reload dev server
pnpm db:studio    # visual DB browser (Drizzle Studio)
pnpm db:generate  # generate migration after schema change
pnpm db:migrate   # apply migrations
pnpm test         # build + run tests
```
