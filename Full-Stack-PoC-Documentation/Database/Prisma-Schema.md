Database schema and data access layer for the Pay-What-You-Want PoC. The application uses PostgreSQL managed by Supabase, with Prisma ORM for schema management and queries, connected through the `@prisma/adapter-pg` PostgreSQL adapter.

**Schema file:** `prisma/schema.prisma`

## Generator

| Setting  | Value                    | Note                        |
| -------- | ------------------------ | --------------------------- |
| Provider | `prisma-client`          | Generates typed client      |
| Output   | `../lib/generated/prisma` | Co-located with app code   |

## Models

### documents

| Column           | Prisma Type  | Nullable | Default           | DB Type          | Description              |
| ---------------- | ------------ | -------- | ----------------- | ---------------- | ------------------------ |
| `id`             | `Int`        | No       | `autoincrement()` | integer          | Primary key              |
| `title`          | `String`     | No       | —                 | text             | Document title           |
| `description`    | `String`     | No       | —                 | text             | Document description     |
| `file_url`       | `String`     | No       | —                 | text             | Download URL             |
| `category`       | `String?`    | Yes      | —                 | text             | Category label           |
| `suggested_price`| `Decimal?`   | Yes      | —                 | `Decimal(10,2)`  | Suggested price          |
| `created_at`     | `DateTime?`  | Yes      | `now()`           | `Timestamptz(6)` | Creation timestamp       |

- Relation: has many `submissions`

### submissions

| Column        | Prisma Type | Nullable | Default              | DB Type          | Description                      |
| ------------- | ----------- | -------- | -------------------- | ---------------- | -------------------------------- |
| `id`          | `String`    | No       | `gen_random_uuid()`  | `UUID`           | Primary key (DB-generated UUID)  |
| `document_id` | `Int`       | No       | —                    | integer          | Foreign key to `documents.id`    |
| `amount`      | `Decimal`   | No       | —                    | `Decimal(10,2)`  | Payment amount                   |
| `email`       | `String?`   | Yes      | —                    | text             | Submitter email                  |
| `created_at`  | `DateTime?` | Yes      | `now()`              | `Timestamptz(6)` | Submission timestamp             |

- Foreign key: `document_id` references `documents.id` — cascade on delete, no action on update

## Indexes

| Index Name                     | Table       | Column(s)     | Purpose                        |
| ------------------------------ | ----------- | ------------- | ------------------------------ |
| `documents_pkey`               | documents   | `id`          | Primary key (implicit)         |
| `submissions_pkey`             | submissions | `id`          | Primary key (implicit)         |
| `idx_submissions_document_id`  | submissions | `document_id` | Fast lookup by document        |
| `idx_submissions_created_at`   | submissions | `created_at`  | Fast ordering/filtering by date|

## Connection Strategy

The project uses a dual-URL pattern to separate CLI operations from runtime queries, required by pgBouncer transaction-mode pooling.

| Context                     | Env Variable   | Pooling Mode     | Used By           |
| --------------------------- | -------------- | ---------------- | ----------------- |
| CLI (migrate, db pull)      | `DIRECT_URL`   | Session (port 5432) | `prisma.config.ts` |
| Runtime (queries)           | `DATABASE_URL`  | Transaction (pgBouncer) | `lib/prisma.ts` |

- **`prisma.config.ts`** — loads `.env.local` then `.env` via dotenv, passes `DIRECT_URL` to Prisma CLI. Session-mode pooling is required for CLI operations that hold long-lived connections (migrations, introspection).
- **`lib/prisma.ts`** — creates a `pg.Pool` with `DATABASE_URL` (transaction-mode pgBouncer), wraps it in `PrismaPg` adapter, passes to `PrismaClient`. Uses the global singleton pattern (`globalForPrisma`) to avoid exhausting connections during development hot-reload.

## Data Access Layer (`lib/documents.ts`)

Marked `"use server"` — runs as a server action.

| Function           | Query                                                                | Returns                                  |
| ------------------ | -------------------------------------------------------------------- | ---------------------------------------- |
| `getAllDocuments`   | `prisma.documents.findMany({ orderBy: { created_at: "desc" } })`    | Serialized `Document[]` or `Error`       |
| `getDocumentById`  | `prisma.documents.findUnique({ where: { id } })`                    | Serialized `Document \| null` or `Error` |

**Serialization:** Both functions convert `Decimal` fields to `Number` and `DateTime` fields to ISO strings before returning, so consumers receive plain JSON-safe values.

**Error handling:** Catches exceptions and returns `Error` objects rather than throwing.

## TypeScript Types (`lib/types.ts`)

Post-serialization shapes used by components and API responses.

| Type         | Key Fields                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| `Document`   | `id: number`, `title: string`, `description: string`, `file_url: string`, `category: string \| null`, `suggested_price: number \| null`, `created_at: string \| null` |
| `Submission` | `id: string`, `document_id: number`, `amount: number`, `email: string \| null`, `created_at: string \| null` |
