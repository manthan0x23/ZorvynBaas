# API Documentation

**Base URL:** `http://localhost:{PORT}/api`  
**Content-Type:** `application/json`  
**Authentication:** Cookie-based session (`session_id` HttpOnly cookie, set automatically on login)

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Records](#records)
- [Dashboard](#dashboard)
- [Error Reference](#error-reference)
- [Rate Limiting](#rate-limiting)
- [Permissions Reference](#permissions-reference)

---

## Authentication

All routes except `/health`, `/api/auth/register`, and `/api/auth/login` require an active session. Sessions are created on both **register** and **login** — the `session_id` cookie is set on both responses. The browser (or HTTP client) sends it automatically on every subsequent request.

> **Note for API clients (Postman, curl, etc.):** Enable cookie storage / `--cookie-jar` so the `session_id` cookie is persisted and replayed across requests.

### POST `/api/auth/register`

Register a new account and start a session immediately. No separate login step is required after registration.

**Request Body**

| Field      | Type   | Required | Constraints                                                                 |
| ---------- | ------ | -------- | --------------------------------------------------------------------------- |
| `username` | string | ✓        | 3–32 chars, lowercase letters / numbers / underscores only (`^[a-z0-9_]+$`) |
| `password` | string | ✓        | 8–128 characters                                                            |

**Response `201`** — `session_id` cookie is set

```json
{
  "ok": true,
  "data": {
    "userId": "ab12cd"
  }
}
```

**Set-Cookie header (automatic)**

```
Set-Cookie: session_id=<opaque>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800
```

> `Secure` flag is also added in production.

**Errors**

| Status | Code               | Reason                                                     |
| ------ | ------------------ | ---------------------------------------------------------- |
| `422`  | `VALIDATION_ERROR` | Schema violation — see `fields` map for per-field messages |
| `409`  | `CONFLICT`         | Username already taken                                     |
| `429`  | `RATE_LIMITED`     | Auth rate limit exceeded                                   |

```json
{
  "ok": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "fields": {
    "username": ["Only lowercase letters, numbers, underscores"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

---

### POST `/api/auth/login`

Authenticate with credentials and start a session.

> Subject to a stricter per-IP rate limit on top of the general auth limiter (see [Rate Limiting](#rate-limiting)).

**Request Body**

| Field      | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `username` | string | ✓        | Registered username |
| `password` | string | ✓        | Account password    |

**Response `200`** — `session_id` cookie is set

Returns the authenticated user's safe profile (password hash is never included).

```json
{
  "ok": true,
  "data": {
    "id": "ab12cd",
    "username": "alice_99",
    "role": "viewer"
  }
}
```

**Set-Cookie header (automatic)**

```
Set-Cookie: session_id=<opaque>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800
```

> `Secure` flag is also added in production.

**Errors**

| Status | Code               | Reason                        |
| ------ | ------------------ | ----------------------------- |
| `422`  | `VALIDATION_ERROR` | Empty username or password    |
| `404`  | `NOT_FOUND`        | No account with that username |
| `401`  | `UNAUTHORIZED`     | Password incorrect            |
| `429`  | `RATE_LIMITED`     | Login rate limit exceeded     |

---

### POST `/api/auth/logout`

🔒 Requires authentication.

Invalidates the current session and clears the `session_id` cookie.

**Response `200`**

```json
{ "ok": true }
```

---

### POST `/api/auth/logout-all`

🔒 Requires authentication.

Invalidates **all** active sessions for the current user and clears the `session_id` cookie.

**Response `200`**

```json
{ "ok": true }
```

---

## Users

All routes require authentication. Most require specific permissions.

### GET `/api/users/me`

🔒 Requires authentication.

Returns the profile of the currently authenticated user.

**Response `200`**

```json
{
  "ok": true,
  "data": {
    "id": "ab12cd",
    "username": "alice_99",
    "role": "viewer"
  }
}
```

---

### PATCH `/api/users/me/password`

🔒 Requires authentication.

Change the current user's password. On success, **all sessions are revoked** (including the current one) and the `session_id` cookie is cleared — the client must log in again.

**Request Body**

| Field             | Type   | Required | Constraints                                     |
| ----------------- | ------ | -------- | ----------------------------------------------- |
| `currentPassword` | string | ✓        | Must match the stored password                  |
| `newPassword`     | string | ✓        | 8–128 chars, must differ from `currentPassword` |

**Response `200`**

```json
{
  "ok": true,
  "message": "Password changed. Please log in again."
}
```

**Errors**

| Status | Code               | Reason                                                |
| ------ | ------------------ | ----------------------------------------------------- |
| `422`  | `VALIDATION_ERROR` | Schema violation (e.g. `newPassword` same as current) |
| `401`  | `UNAUTHORIZED`     | `currentPassword` is incorrect                        |

---

### GET `/api/users`

🔒 Requires permission: `user:read`

List all users with optional filters.

**Query Parameters**

| Param    | Type                             | Description                                   |
| -------- | -------------------------------- | --------------------------------------------- |
| `role`   | `viewer` \| `analyst` \| `admin` | Filter by role (optional)                     |
| `search` | string                           | Filter by username — partial match (optional) |

**Response `200`**

```json
{
  "ok": true,
  "data": [
    { "id": "ab12cd", "username": "alice_99", "role": "viewer" },
    { "id": "ef34gh", "username": "bob_01", "role": "analyst" }
  ]
}
```

**Errors**

| Status | Code               | Reason                         |
| ------ | ------------------ | ------------------------------ |
| `401`  | `UNAUTHORIZED`     | No active session              |
| `403`  | `FORBIDDEN`        | Missing `user:read` permission |
| `422`  | `VALIDATION_ERROR` | Invalid `role` value           |

---

### GET `/api/users/:id`

🔒 Requires permission: `user:read`

Fetch a single user by ID.

**Path Parameters**

| Param | Type   | Description                 |
| ----- | ------ | --------------------------- |
| `id`  | string | Exactly 6-character user ID |

**Response `200`**

```json
{
  "ok": true,
  "data": { "id": "ab12cd", "username": "alice_99", "role": "viewer" }
}
```

**Errors**

| Status | Code               | Reason                           |
| ------ | ------------------ | -------------------------------- |
| `401`  | `UNAUTHORIZED`     | No active session                |
| `403`  | `FORBIDDEN`        | Missing `user:read` permission   |
| `404`  | `NOT_FOUND`        | No user with that ID             |
| `422`  | `VALIDATION_ERROR` | `id` is not exactly 6 characters |

---

### PATCH `/api/users/:id/role`

🔒 Requires permission: `user:update`

Update the role of a specific user. All active sessions for the target user are revoked on success.

**Path Parameters**

| Param | Type   | Description                 |
| ----- | ------ | --------------------------- |
| `id`  | string | Exactly 6-character user ID |

**Request Body**

| Field  | Type                             | Required | Description        |
| ------ | -------------------------------- | -------- | ------------------ |
| `role` | `viewer` \| `analyst` \| `admin` | ✓        | New role to assign |

**Response `200`**

```json
{ "ok": true }
```

**Errors**

| Status | Code               | Reason                               |
| ------ | ------------------ | ------------------------------------ |
| `401`  | `UNAUTHORIZED`     | No active session                    |
| `403`  | `FORBIDDEN`        | Missing `user:update` permission     |
| `404`  | `NOT_FOUND`        | No user with that ID                 |
| `422`  | `VALIDATION_ERROR` | Invalid role value or malformed `id` |

---

### DELETE `/api/users/:id`

🔒 Requires permission: `user:delete`

Permanently delete a user. All sessions for that user are also revoked before deletion.

**Path Parameters**

| Param | Type   | Description                 |
| ----- | ------ | --------------------------- |
| `id`  | string | Exactly 6-character user ID |

**Response `200`**

```json
{ "ok": true }
```

**Errors**

| Status | Code               | Reason                           |
| ------ | ------------------ | -------------------------------- |
| `401`  | `UNAUTHORIZED`     | No active session                |
| `403`  | `FORBIDDEN`        | Missing `user:delete` permission |
| `404`  | `NOT_FOUND`        | No user with that ID             |
| `422`  | `VALIDATION_ERROR` | `id` is not exactly 6 characters |

---

## Records

All routes require authentication. Records are soft-deleted (`deletedAt` is set; the row is never removed).

### GET `/api/records`

🔒 Requires permission: `record:read`

Returns a paginated, date-ordered (`occurredAt` desc) list of non-deleted records.

**Query Parameters**

| Param      | Type                                 | Default | Description                           |
| ---------- | ------------------------------------ | ------- | ------------------------------------- |
| `category` | string                               | —       | Filter by category name (exact match) |
| `type`     | `income` \| `expense` \| `special`   | —       | Filter by category type               |
| `status`   | `pending` \| `posted` \| `cancelled` | —       | Filter by record status               |
| `from`     | ISO date string                      | —       | `occurredAt` >= this date             |
| `to`       | ISO date string                      | —       | `occurredAt` <= this date             |
| `page`     | integer ≥ 1                          | `1`     | Page number                           |
| `limit`    | integer 1–100                        | `20`    | Page size                             |

**Response `200`**

```json
{
  "ok": true,
  "data": [
    {
      "id": "a1b2c3d4",
      "amount": "1500.00",
      "notes": "Monthly electricity bill",
      "occurredAt": "2024-03-15T00:00:00.000Z",
      "status": "posted",
      "createdAt": "2024-03-15T10:22:00.000Z",
      "updatedAt": "2024-03-15T10:22:00.000Z",
      "category": { "id": "cat001", "name": "Utilities", "type": "expense" }
    }
  ]
}
```

**Errors**

| Status | Code               | Reason                              |
| ------ | ------------------ | ----------------------------------- |
| `401`  | `UNAUTHORIZED`     | No active session                   |
| `403`  | `FORBIDDEN`        | Missing `record:read` permission    |
| `422`  | `VALIDATION_ERROR` | Invalid enum value in filter params |

---

### GET `/api/records/:id`

🔒 Requires permission: `record:read`

**Path Parameters**

| Param | Type   | Description                   |
| ----- | ------ | ----------------------------- |
| `id`  | string | Exactly 8-character record ID |

**Response `200`**

```json
{
  "ok": true,
  "data": {
    "id": "a1b2c3d4",
    "amount": "1500.00",
    "notes": "Monthly electricity bill",
    "occurredAt": "2024-03-15T00:00:00.000Z",
    "status": "posted",
    "createdAt": "2024-03-15T10:22:00.000Z",
    "updatedAt": "2024-03-15T10:22:00.000Z",
    "category": { "id": "cat001", "name": "Utilities", "type": "expense" }
  }
}
```

**Errors**

| Status | Code               | Reason                           |
| ------ | ------------------ | -------------------------------- |
| `401`  | `UNAUTHORIZED`     | No active session                |
| `403`  | `FORBIDDEN`        | Missing `record:read` permission |
| `404`  | `NOT_FOUND`        | No record with that ID           |
| `422`  | `VALIDATION_ERROR` | `id` is not exactly 8 characters |

---

### POST `/api/records`

🔒 Requires permission: `record:create`

Creates a new financial record. The `category` field is a name — if no category with that name exists it is created automatically using the provided `type`. `amount` is stored as a 2 d.p. decimal string internally.

**Request Body**

| Field        | Type                                 | Required | Constraints                            |
| ------------ | ------------------------------------ | -------- | -------------------------------------- |
| `category`   | string                               | ✓        | Category name; created on first use    |
| `amount`     | number                               | ✓        | Must be > 0                            |
| `occurredAt` | ISO date string                      | ✓        | When the transaction occurred          |
| `notes`      | string                               | —        | Max 500 characters                     |
| `status`     | `pending` \| `posted` \| `cancelled` | —        | Defaults to `posted`                   |
| `type`       | `income` \| `expense` \| `special`   | —        | Used only when creating a new category |

**Response `201`** — full record object

```json
{
  "ok": true,
  "data": {
    "id": "a1b2c3d4",
    "amount": "1500.00",
    "notes": "Monthly electricity bill",
    "occurredAt": "2024-03-15T00:00:00.000Z",
    "status": "posted",
    "createdAt": "2024-03-15T10:22:00.000Z",
    "updatedAt": "2024-03-15T10:22:00.000Z",
    "category": { "id": "cat001", "name": "Utilities", "type": "expense" }
  }
}
```

**Errors**

| Status | Code               | Reason                                                        |
| ------ | ------------------ | ------------------------------------------------------------- |
| `400`  | `BAD_REQUEST`      | `amount` is ≤ 0 (caught in service after schema passes)       |
| `401`  | `UNAUTHORIZED`     | No active session                                             |
| `403`  | `FORBIDDEN`        | Missing `record:create` permission                            |
| `422`  | `VALIDATION_ERROR` | Schema violation (missing required field, invalid enum, etc.) |

---

### PATCH `/api/records/:id`

🔒 Requires permission: `record:update`

All fields are optional — only provided fields are updated. Returns the full updated record.

**Path Parameters**

| Param | Type   | Description                   |
| ----- | ------ | ----------------------------- |
| `id`  | string | Exactly 8-character record ID |

**Request Body** — all fields optional

| Field        | Type                                 | Constraints                                  |
| ------------ | ------------------------------------ | -------------------------------------------- |
| `category`   | string                               | New category name                            |
| `amount`     | number                               | Must be > 0 if provided                      |
| `notes`      | string                               | Max 500 characters                           |
| `occurredAt` | ISO date string                      | New transaction date                         |
| `status`     | `pending` \| `posted` \| `cancelled` |                                              |
| `type`       | `income` \| `expense` \| `special`   | Used only if also changing to a new category |

**Response `200`** — full updated record object

```json
{
  "ok": true,
  "data": {
    "id": "a1b2c3d4",
    "amount": "2000.00",
    "notes": "Updated note",
    "occurredAt": "2024-04-01T00:00:00.000Z",
    "status": "posted",
    "createdAt": "2024-03-15T10:22:00.000Z",
    "updatedAt": "2024-04-01T09:00:00.000Z",
    "category": { "id": "cat002", "name": "Rent", "type": "expense" }
  }
}
```

**Errors**

| Status | Code               | Reason                             |
| ------ | ------------------ | ---------------------------------- |
| `400`  | `BAD_REQUEST`      | `amount` is ≤ 0                    |
| `401`  | `UNAUTHORIZED`     | No active session                  |
| `403`  | `FORBIDDEN`        | Missing `record:update` permission |
| `404`  | `NOT_FOUND`        | No record with that ID             |
| `422`  | `VALIDATION_ERROR` | Schema violation                   |

---

### DELETE `/api/records/:id`

🔒 Requires permission: `record:delete`

Soft-deletes the record — sets `deletedAt` to now. The row is not removed from the database. Soft-deleted records are excluded from all read queries.

**Path Parameters**

| Param | Type   | Description                   |
| ----- | ------ | ----------------------------- |
| `id`  | string | Exactly 8-character record ID |

**Response `200`**

```json
{ "ok": true }
```

**Errors**

| Status | Code               | Reason                                           |
| ------ | ------------------ | ------------------------------------------------ |
| `401`  | `UNAUTHORIZED`     | No active session                                |
| `403`  | `FORBIDDEN`        | Missing `record:delete` permission               |
| `404`  | `NOT_FOUND`        | No record with that ID (or already soft-deleted) |
| `422`  | `VALIDATION_ERROR` | `id` is not exactly 8 characters                 |

---

## Dashboard

All routes require authentication. Only `posted` records are included in all aggregations.

### GET `/api/dashboard/summary`

🔒 Requires permission: `dashboard:read`

Returns aggregate totals broken down by type and category, plus the 10 most recent records. All query parameters are optional — omitting both `from` and `to` returns totals across all time.

**Query Parameters**

| Param  | Type            | Required | Description                                                                           |
| ------ | --------------- | -------- | ------------------------------------------------------------------------------------- |
| `from` | ISO date string | —        | Filter records with `occurredAt` >= this date                                         |
| `to`   | ISO date string | —        | Filter records with `occurredAt` <= this date. Must be ≥ `from` if both are provided. |

**Response `200`**

```json
{
  "ok": true,
  "data": {
    "totalIncome": 5000.0,
    "totalExpenses": 3200.0,
    "totalSpecial": 150.0,
    "netBalance": 1800.0,
    "categoryTotals": [
      {
        "categoryId": "cat001",
        "categoryName": "Utilities",
        "type": "expense",
        "total": 1500.0
      }
    ],
    "recentActivity": [
      {
        "id": "a1b2c3d4",
        "amount": "1500.00",
        "occurredAt": "2024-03-15T00:00:00.000Z",
        "status": "posted",
        "category": {
          "id": "cat001",
          "name": "Utilities",
          "type": "expense"
        }
      }
    ]
  }
}
```

> `recentActivity` always returns the 10 most recent non-deleted records regardless of the `from`/`to` filter.

**Errors**

| Status | Code               | Reason                              |
| ------ | ------------------ | ----------------------------------- |
| `401`  | `UNAUTHORIZED`     | No active session                   |
| `403`  | `FORBIDDEN`        | Missing `dashboard:read` permission |
| `422`  | `VALIDATION_ERROR` | `from` is after `to`                |

---

### GET `/api/dashboard/trends`

🔒 Requires permission: `dashboard:insights`

Returns income/expense/special totals grouped by month or week for a given year. All 12 months (or 53 weeks) are always returned — periods with no records have zero values.

**Query Parameters**

| Param    | Type                        | Default      | Description                    |
| -------- | --------------------------- | ------------ | ------------------------------ |
| `year`   | integer (2000–current year) | current year | The year to aggregate data for |
| `period` | `monthly` \| `weekly`       | `monthly`    | Grouping granularity           |

**Response `200` — monthly** (`period=monthly`)

```json
{
  "ok": true,
  "data": [
    {
      "month": 1,
      "income": 5000.0,
      "expense": 3200.0,
      "special": 0,
      "net": 1800.0
    },
    {
      "month": 2,
      "income": 4800.0,
      "expense": 2900.0,
      "special": 150.0,
      "net": 1900.0
    }
  ]
}
```

**Response `200` — weekly** (`period=weekly`)

```json
{
  "ok": true,
  "data": [
    {
      "week": 1,
      "income": 1250.0,
      "expense": 800.0,
      "special": 0,
      "net": 450.0
    },
    {
      "week": 2,
      "income": 1100.0,
      "expense": 950.0,
      "special": 50.0,
      "net": 150.0
    }
  ]
}
```

> Weekly grouping uses ISO week numbers. `week` ranges from 1–53. Weeks use `isoyear` to correctly handle weeks that span year boundaries.

**Errors**

| Status | Code               | Reason                                            |
| ------ | ------------------ | ------------------------------------------------- |
| `401`  | `UNAUTHORIZED`     | No active session                                 |
| `403`  | `FORBIDDEN`        | Missing `dashboard:insights` permission           |
| `422`  | `VALIDATION_ERROR` | `year` is not a 4-digit number or is out of range |

---

### GET `/api/dashboard/insights`

🔒 Requires permission: `dashboard:insights`

Returns derived analytics for a given period: top spending categories, savings rate, and categories with the largest change vs the prior equivalent period.

When no date range is supplied, defaults to the **last 30 days**. The prior period is automatically computed as an equally-sized window immediately before `from`.

**Query Parameters**

| Param   | Type            | Default     | Description                                   |
| ------- | --------------- | ----------- | --------------------------------------------- |
| `from`  | ISO date string | 30 days ago | Start of analysis period                      |
| `to`    | ISO date string | now         | End of analysis period. Must be ≥ `from`.     |
| `limit` | integer (1–20)  | `5`         | Max number of categories returned per section |

**Response `200`**

```json
{
  "ok": true,
  "data": {
    "period": {
      "from": "2024-03-01T00:00:00.000Z",
      "to": "2024-03-31T23:59:59.999Z"
    },
    "spendingPatterns": {
      "totalExpense": 3200.0,
      "topCategories": [
        {
          "categoryId": "cat001",
          "categoryName": "Utilities",
          "total": 1500.0,
          "sharePercent": 46.88
        }
      ]
    },
    "savingsRate": {
      "totalIncome": 5000.0,
      "totalExpenses": 3200.0,
      "net": 1800.0,
      "savingsRate": 36.0
    },
    "topMovers": {
      "increased": [
        {
          "categoryId": "cat002",
          "categoryName": "Dining",
          "type": "expense",
          "current": 800.0,
          "previous": 500.0,
          "delta": 300.0,
          "deltaPercent": 60.0
        }
      ],
      "decreased": [
        {
          "categoryId": "cat003",
          "categoryName": "Transport",
          "type": "expense",
          "current": 200.0,
          "previous": 450.0,
          "delta": -250.0,
          "deltaPercent": -55.56
        }
      ]
    }
  }
}
```

> `deltaPercent` is `null` when the category had no spend in the previous period (divide-by-zero guard).
> `spendingPatterns` and `topMovers` only include `expense` type categories.

**Errors**

| Status | Code               | Reason                                           |
| ------ | ------------------ | ------------------------------------------------ |
| `401`  | `UNAUTHORIZED`     | No active session                                |
| `403`  | `FORBIDDEN`        | Missing `dashboard:insights` permission          |
| `422`  | `VALIDATION_ERROR` | `from` is after `to`, or `limit` is out of range |

## Error Reference

All error responses follow a consistent shape:

```json
{
  "ok": false,
  "code": "ERROR_CODE",
  "message": "Human-readable description"
}
```

| Code               | HTTP Status | Description                                                                     |
| ------------------ | ----------- | ------------------------------------------------------------------------------- |
| `BAD_REQUEST`      | 400         | Semantic validation failed after schema passed (e.g. amount ≤ 0)                |
| `CONFLICT`         | 409         | Unique constraint violation (e.g. username already taken)                       |
| `VALIDATION_ERROR` | 422         | Schema violation — response includes a `fields` map with per-field error arrays |
| `UNAUTHORIZED`     | 401         | Missing, expired, or invalid session cookie                                     |
| `FORBIDDEN`        | 403         | Authenticated user lacks the required permission                                |
| `NOT_FOUND`        | 404         | Resource or route does not exist                                                |
| `RATE_LIMITED`     | 429         | Too many requests — back off and retry                                          |
| `INTERNAL_ERROR`   | 500         | Unexpected server error                                                         |

---

## Rate Limiting

The API applies layered rate limiting:

| Layer            | Applies To                                     | Window       | Max Requests                      |
| ---------------- | ---------------------------------------------- | ------------ | --------------------------------- |
| Global (strict)  | All routes                                     | 15 min       | 100                               |
| Auth routes      | `/api/auth/*`                                  | Configurable | Lower threshold                   |
| Login endpoint   | `POST /api/auth/login`                         | Configurable | Stricter (brute-force protection) |
| Global (lenient) | `/api/users`, `/api/records`, `/api/dashboard` | Configurable | Higher threshold                  |

When exceeded, the API returns:

```json
{
  "ok": false,
  "code": "RATE_LIMITED",
  "message": "Too many requests"
}
```

Standard rate-limit headers (`RateLimit-*`) are included in every response.

---

## Permissions Reference

Roles are granted a set of permissions. The `authorize` middleware enforces these per route.

| Permission           | Grants Access To                                           |
| -------------------- | ---------------------------------------------------------- |
| `user:read`          | `GET /api/users`, `GET /api/users/:id`                     |
| `user:update`        | `PATCH /api/users/:id/role`                                |
| `user:delete`        | `DELETE /api/users/:id`                                    |
| `record:read`        | `GET /api/records`, `GET /api/records/:id`                 |
| `record:create`      | `POST /api/records`                                        |
| `record:update`      | `PATCH /api/records/:id`                                   |
| `record:delete`      | `DELETE /api/records/:id`                                  |
| `dashboard:read`     | `GET /api/dashboard/summary`                               |
| `dashboard:insights` | `GET /api/dashboard/trends`, `GET /api/dashboard/insights` |

> Permissions are additive — a role may hold any combination of the above.
