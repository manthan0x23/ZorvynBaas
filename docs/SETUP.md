# Setup

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | 10.17.1 (enforced via `packageManager`) |
| Docker & Docker Compose | any recent version |

---

## Option A — pnpm (local development)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

```env
PORT=3000
NODE_ENV=development

# PostgreSQL connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fdp_db
```

### 3. Start the database

Spins up a PostgreSQL container defined in `src/db/postgres/docker-compose.yml`:

```bash
pnpm db:up
```

> This also automatically provisions the test database referenced in `.env.test`.

### 4. Run migrations

```bash
pnpm db:migrate
```

### 5. Seed default users

Creates one user per role (`admin1`, `analyst1`, `viewer1`) with the default password `password123`. Skips users that already exist.

```bash
pnpm db:seed
```

### 6. Start the dev server

```bash
pnpm dev
```

The server starts at `http://localhost:3000`.  
Swagger UI is available at `http://localhost:3000/api/docs`.

---

## Option B — Docker Compose (full stack)

Builds and starts the API and PostgreSQL together. Migrations and seeding run automatically as part of the container startup.

```bash
docker-compose up --build
```

The API is available at `http://localhost:3000`.

To stop and remove containers:

```bash
docker-compose down
```

---

## Default Seed Users

| Username | Password | Role |
|----------|----------|------|
| `admin1` | `password123` | `admin` |
| `analyst1` | `password123` | `analyst` |
| `viewer1` | `password123` | `viewer` |

> Change these passwords immediately in any non-local environment.

---

## Testing

The project includes minimal end-to-end tests written with [Vitest](https://vitest.dev/) and [Supertest](https://github.com/ladjs/supertest).

### Test database setup

The test suite uses a separate database configured in `.env.test`. Running `pnpm db:up` automatically provisions this test database — no extra steps required.

Before each test run, the setup script [`vitest.setup.ts`](../src/__tests__/vitest.setup.ts) applies all pending migrations and seeds the three default users (`admin1`, `analyst1`, `viewer1`) into the test database. After the run, teardown truncates all tables so the database is clean for the next run.

### Running tests

```bash
pnpm test
```

This compiles TypeScript and then runs the full test suite.

### What's covered

| Suite | What it tests |
|-------|---------------|
| Login (correct credentials) | Returns 200, sets an `HttpOnly`/`SameSite=Lax` session cookie, returns the user profile without `hashedPassword` |
| Login rate limit | Triggers `429 TOO_MANY_LOGIN_ATTEMPTS` after 6 rapid failed attempts |
| Schema validation | `POST /api/auth/register` with an invalid username returns `422 VALIDATION_ERROR` with field-level errors; `POST /api/records` with missing fields returns the same |
| Authorization | A `viewer` role cannot create records — returns `403 FORBIDDEN` |
| Soft delete | Create a record → delete it → fetching it by ID returns `404 NOT_FOUND` |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with hot-reload (`tsx watch`) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled output |
| `pnpm test` | Build then run tests |
| `pnpm db:up` | Start the PostgreSQL Docker container (also provisions the test database) |
| `pnpm db:down` | Stop PostgreSQL and wipe its data volume |
| `pnpm db:generate` | Generate a new Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Seed default users (idempotent — safe to re-run) |
| `pnpm db:studio` | Open Drizzle Studio in the browser |