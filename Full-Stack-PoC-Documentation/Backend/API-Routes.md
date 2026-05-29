API route handlers for the Pay-What-You-Want PoC. All routes use the Next.js App Router convention — exported async functions in `route.ts` files — and return JSON via `NextResponse.json()`.

## Routes Overview

| Method | Route                  | File                                  | Description                |
| ------ | ---------------------- | ------------------------------------- | -------------------------- |
| GET    | `/api/documents`       | `app/api/documents/route.ts`          | Returns all documents      |
| GET    | `/api/documents/[id]`  | `app/api/documents/[id]/route.ts`     | Returns a single document  |

## GET /api/documents

**Data source:** `getAllDocuments()` from `lib/documents.ts`

**Query:** `prisma.documents.findMany({ orderBy: { created_at: "desc" } })`

**Status codes:**

| Code | Condition |
| ---- | --------- |
| 200  | Success   |

**Response shape** (JSON array):

```json
[
  {
    "id": 1,
    "title": "string",
    "description": "string",
    "file_url": "string",
    "category": "string | null",
    "suggested_price": 9.99,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
]
```

## GET /api/documents/[id]

**Data source:** `getDocumentById(id)` from `lib/documents.ts`

**Query:** `prisma.documents.findUnique({ where: { id } })`

**Parameter parsing:** `parseInt(params.id, 10)` — validated with `isNaN()` before querying.

**Status codes:**

| Code | Condition                                  | Response body                      |
| ---- | ------------------------------------------ | ---------------------------------- |
| 200  | Document found                             | Single document object (see above) |
| 400  | `id` param is not a valid integer (`NaN`)  | `{ "error": "Invalid document ID" }` |
| 404  | No document with that ID exists            | `{ "error": "Document not found" }` |

## Serialization Notes

- Prisma returns `Decimal` objects for the `suggested_price` column (`Decimal(10,2)`). The data access layer converts these to plain JavaScript `Number` via `Number(doc.suggested_price)` before they reach the API response.
- Prisma returns `Date` objects for `created_at`. These are converted to ISO 8601 strings via `.toISOString()`.
- Both conversions happen in `lib/documents.ts`, not in the route handlers. The route handlers pass through the already-serialized data.
