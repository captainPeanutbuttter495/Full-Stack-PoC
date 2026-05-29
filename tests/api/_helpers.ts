import { vi } from "vitest";

/**
 * Shared helpers for API route-handler tests.
 *
 * These are plain factories — they must NOT import any module that the test
 * files mock (e.g. `@/lib/prisma`, `@/lib/supabase/server`), so they stay
 * mock-agnostic and can be reused across suites.
 */

const TEST_USER_ID = "11111111-1111-1111-1111-111111111111";

/** Build a mocked Supabase server client with a controllable auth user. */
export function makeSupabaseClient(user: { id: string } | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  };
}

export const authedUser = { id: TEST_USER_ID };

/** A document row as returned by `lib/documents.ts` (already serialized). */
export function makeDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Sample Doc",
    description: "A sample document",
    file_url: "docs/sample.pdf",
    category: "guides",
    suggested_price: 9.99,
    created_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Build a POST Request for the submissions route. */
export function postSubmission(body: unknown) {
  return new Request("http://localhost/api/submissions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** A Prisma "P2003" foreign-key violation, mimicking a missing document_id. */
export function fkViolation() {
  return Object.assign(new Error("Foreign key constraint failed"), {
    code: "P2003",
  });
}
