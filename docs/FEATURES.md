# Technical Features

---

## Request Tracing & Structured Logging

Every request is stamped with a unique `request_id` by `requestTracer` and threaded through every layer via `RequestContext`:

```
requestTracer → handler(ctx) → service(ctx) → repo(ctx)
```

Every log line at every depth carries that same ID, so a full request trace is a single grep.

**Output is dual-channel:**

| Channel | Format | Destination |
|---|---|---|
| Console | Colored human-readable | stdout / stderr |
| File | Newline-delimited JSON | `logs/YYYY-MM-DD/app.log` |
| File (errors) | Same JSON | `logs/YYYY-MM-DD/error.log` |

File rotation is built in — 10 MB cap, 5 backups max, date-partitioned folders. No external daemon needed.

---

## Error Handling

All errors extend `AppError(message, statusCode, code)`. One global handler at the bottom of the stack covers everything.

| Class | Status | Code |
|---|---|---|
| `ValidationError` | 422 | `VALIDATION_ERROR` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ConflictError` | 409 | `CONFLICT` |
| `BadRequestError` | 400 | `BAD_REQUEST` |
| *(unhandled)* | 500 | `INTERNAL_ERROR` |

`ValidationError` additionally includes a `fields: Record<string, string[]>` map. Raw errors and stack traces are never exposed to the client.

---

## Async Handler

A single wrapper eliminates try/catch in every handler:

```typescript
export const asyncHandler = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};
```

Any throw — known `AppError` or unexpected runtime error — is forwarded to the global error handler automatically.

---

## Validation

A generic `validate(schema, target)` middleware runs Zod before the handler. `target` is `"body"`, `"query"`, or `"params"`. Parsed output lands on `req.validated[target]` — handlers never touch raw `req.body`.

Notable schema behaviours:

| Schema | Behaviour |
|---|---|
| `RegisterSchema` | `username` enforces `/^[a-z0-9_]+$/`; `password` 8–128 chars |
| `ChangePasswordSchema` | `.refine()` rejects `newPassword === currentPassword` |
| `UserIdSchema` / `RecordIdSchema` | `.length(6)` / `.length(8)` — wrong length never reaches the DB |
| `RecordFilterSchema` | `z.coerce.number()` / `z.coerce.date()` handle query-string types |
| `UpdateRecordSchema` | Derived as `CreateRecordSchema.partial()` — constraints stay in sync |

---

## Rate Limiting

Three layers, each mounted at a different scope:

| Layer | Mounted on | Purpose |
|---|---|---|
| Global strict | `app.ts` top-level | Absolute 100 req / 15 min ceiling |
| Auth limiter | `router.use` in `auth.routes.ts` | Tighter cap on all `/api/auth/*` |
| Login limiter | `POST /api/auth/login` only | Per-IP brute-force guard |
| Global lenient | `app.ts` after auth routes | Higher threshold for authenticated routes |

All limiters emit standard `RateLimit-*` headers. Over-limit response: `429 RATE_LIMITED`.

---

## Session-Based Authentication

Server-side sessions in PostgreSQL — no JWTs.

1. On register or login, `sessionService.create()` inserts a session row and returns an opaque `session_id`
2. Cookie set: `HttpOnly; SameSite=Lax; Max-Age=604800; Secure` (prod only)
3. `authenticate` middleware reads the cookie, looks up the session, attaches `req.user`
4. Missing or invalid session → `401 UnauthorizedError`

**Session revocation triggers:**

| Event | Scope |
|---|---|
| `POST /auth/logout` | Current session |
| `POST /auth/logout-all` | All sessions for user |
| `PATCH /users/me/password` | All sessions for user |
| `PATCH /users/:id/role` | All sessions for target user |
| `DELETE /users/:id` | All sessions for target user |

`res.clearCookie()` is called alongside every revocation so the browser discards the cookie immediately.

---

## Soft Deletes

`recordRepo.delete()` sets `deletedAt = now()` — no `DELETE` statement is ever executed. A single constant is composed into every read query:

```typescript
const notDeleted = isNull(financialRecords.deletedAt);
```

Applied in: `findById`, `findAll`, all aggregations, `recentActivity`. A second delete on the same record finds nothing (filtered out) and returns `404`.

---

## Permission-Based Authorization

Defined in `src/lib/permissions.ts`. A `PERMISSION_ROLES` reverse index is built once at module load — both directions are O(1) lookups.

**Role matrix:**

| Permission | viewer | analyst | admin |
|---|:---:|:---:|:---:|
| `record:read` | ✓ | ✓ | ✓ |
| `record:create` | | ✓ | ✓ |
| `record:update` | | ✓ | ✓ |
| `record:delete` | | | ✓ |
| `user:read/create/update/delete` | | | ✓ |
| `dashboard:read` | ✓ | ✓ | ✓ |
| `dashboard:insights` | | ✓ | ✓ |
| `category:read` | ✓ | ✓ | ✓ |
| `category:manage` | | | ✓ |

**Exported utilities:**

```typescript
hasPermission(role, permission)      // → boolean
assertPermission(role, permission)   // → throws ForbiddenError if denied
rolesWithPermission(permission)      // → UserRole[] (used for DB-level filtering)
```

`authorize(permission)` middleware calls `assertPermission`. The throw propagates via `asyncHandler → next → global error handler` — no try/catch needed in the middleware.