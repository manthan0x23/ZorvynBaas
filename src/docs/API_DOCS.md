## Dashboard

All routes require authentication. Only `posted` records are included in all aggregations.

### GET `/api/dashboard/summary`

🔒 Requires permission: `dashboard:read`

Returns aggregate totals broken down by type and category, plus the 10 most recent records. All query parameters are optional — omitting both `from` and `to` returns totals across all time.

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | ISO date string | — | Filter records with `occurredAt` >= this date |
| `to` | ISO date string | — | Filter records with `occurredAt` <= this date. Must be ≥ `from` if both are provided. |

**Response `200`**

```json
{
  "ok": true,
  "data": {
    "totalIncome": 5000.00,
    "totalExpenses": 3200.00,
    "totalSpecial": 150.00,
    "netBalance": 1800.00,
    "categoryTotals": [
      {
        "categoryId": "cat001",
        "categoryName": "Utilities",
        "type": "expense",
        "total": 1500.00
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

| Status | Code | Reason |
|--------|------|--------|
| `401` | `UNAUTHORIZED` | No active session |
| `403` | `FORBIDDEN` | Missing `dashboard:read` permission |
| `422` | `VALIDATION_ERROR` | `from` is after `to` |

---

### GET `/api/dashboard/trends`

🔒 Requires permission: `dashboard:insights`

Returns income/expense/special totals grouped by month or week for a given year. All 12 months (or 53 weeks) are always returned — periods with no records have zero values.

**Query Parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `year` | integer (2000–current year) | current year | The year to aggregate data for |
| `period` | `monthly` \| `weekly` | `monthly` | Grouping granularity |

**Response `200` — monthly** (`period=monthly`)

```json
{
  "ok": true,
  "data": [
    { "month": 1, "income": 5000.00, "expense": 3200.00, "special": 0, "net": 1800.00 },
    { "month": 2, "income": 4800.00, "expense": 2900.00, "special": 150.00, "net": 1900.00 }
  ]
}
```

**Response `200` — weekly** (`period=weekly`)

```json
{
  "ok": true,
  "data": [
    { "week": 1, "income": 1250.00, "expense": 800.00, "special": 0, "net": 450.00 },
    { "week": 2, "income": 1100.00, "expense": 950.00, "special": 50.00, "net": 150.00 }
  ]
}
```

> Weekly grouping uses ISO week numbers. `week` ranges from 1–53. Weeks use `isoyear` to correctly handle weeks that span year boundaries.

**Errors**

| Status | Code | Reason |
|--------|------|--------|
| `401` | `UNAUTHORIZED` | No active session |
| `403` | `FORBIDDEN` | Missing `dashboard:insights` permission |
| `422` | `VALIDATION_ERROR` | `year` is not a 4-digit number or is out of range |

---

### GET `/api/dashboard/insights`

🔒 Requires permission: `dashboard:insights`

Returns derived analytics for a given period: top spending categories, savings rate, and categories with the largest change vs the prior equivalent period.

When no date range is supplied, defaults to the **last 30 days**. The prior period is automatically computed as an equally-sized window immediately before `from`.

**Query Parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `from` | ISO date string | 30 days ago | Start of analysis period |
| `to` | ISO date string | now | End of analysis period. Must be ≥ `from`. |
| `limit` | integer (1–20) | `5` | Max number of categories returned per section |

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
      "totalExpense": 3200.00,
      "topCategories": [
        {
          "categoryId": "cat001",
          "categoryName": "Utilities",
          "total": 1500.00,
          "sharePercent": 46.88
        }
      ]
    },
    "savingsRate": {
      "totalIncome": 5000.00,
      "totalExpenses": 3200.00,
      "net": 1800.00,
      "savingsRate": 36.00
    },
    "topMovers": {
      "increased": [
        {
          "categoryId": "cat002",
          "categoryName": "Dining",
          "type": "expense",
          "current": 800.00,
          "previous": 500.00,
          "delta": 300.00,
          "deltaPercent": 60.00
        }
      ],
      "decreased": [
        {
          "categoryId": "cat003",
          "categoryName": "Transport",
          "type": "expense",
          "current": 200.00,
          "previous": 450.00,
          "delta": -250.00,
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

| Status | Code | Reason |
|--------|------|--------|
| `401` | `UNAUTHORIZED` | No active session |
| `403` | `FORBIDDEN` | Missing `dashboard:insights` permission |
| `422` | `VALIDATION_ERROR` | `from` is after `to`, or `limit` is out of range |