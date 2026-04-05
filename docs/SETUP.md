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

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with hot-reload (`tsx watch`) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled output |
| `pnpm test` | Build then run tests |
| `pnpm db:up` | Start the PostgreSQL Docker container |
| `pnpm db:down` | Stop PostgreSQL and wipe its data volume |
| `pnpm db:generate` | Generate a new Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Seed default users (idempotent — safe to re-run) |
| `pnpm db:studio` | Open Drizzle Studio in the browser |