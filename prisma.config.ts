import { config } from "dotenv";
// Load .env.local first (Next.js convention), then fall back to .env
config({ path: ".env.local" });
config();

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL (session-mode pooler, port 5432) is used for CLI operations:
    // prisma db pull, prisma migrate, etc. — bypasses pgBouncer transaction limits.
    // At runtime, PrismaClient receives DATABASE_URL (transaction-mode pooler)
    // via its constructor in lib/prisma.ts.
    url: process.env["DIRECT_URL"],
  },
});
