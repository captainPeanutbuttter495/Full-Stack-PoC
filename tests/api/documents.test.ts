import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeSupabaseClient, authedUser } from "./_helpers";

// Mocked Prisma client. `vi.hoisted` makes the mock object exist before the
// `vi.mock` factory below replaces the real `@/lib/prisma` module.
const prismaMock = vi.hoisted(() => ({
  documents: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

// The documents list route now resolves the current user via Supabase so
// `getAllDocuments(userId)` can compute a per-user `isOwned` flag. Mock the
// server client so each test controls (or omits) the authenticated user.
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// Import the handlers AFTER the mocks are registered.
import { GET as listDocuments } from "@/app/api/documents/route";
import { GET as getDocument } from "@/app/api/documents/[id]/route";
import { createClient } from "@/lib/supabase/server";

const mockedCreateClient = vi.mocked(createClient);

/** Make `createClient()` resolve to a client with the given (or no) user. */
function withUser(user: { id: string } | null) {
  mockedCreateClient.mockResolvedValue(makeSupabaseClient(user) as never);
}

/**
 * A raw `documents` row as Prisma returns it (Decimal price, Date timestamp),
 * before `lib/documents.ts` serializes it. Pass `submissions` to simulate the
 * per-user active-submission include that drives `isOwned`.
 */
function dbRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Sample Doc",
    description: "A sample document",
    file_url: "docs/sample.pdf",
    category: "guides",
    // lib/documents.ts serializes these:
    suggested_price: { toString: () => "9.99" } as never,
    created_at: new Date("2025-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  // resetAllMocks clears both call history AND mocked implementations, so each
  // test must define its own Prisma/Supabase behavior — no leakage between tests.
  vi.resetAllMocks();
});

describe("GET /api/documents", () => {
  it("returns 200 and an array of documents", async () => {
    withUser(null);
    prismaMock.documents.findMany.mockResolvedValue([dbRow()]);

    const res = await listDocuments();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(1);
    // Decimal -> number, Date -> ISO string conversions happened.
    expect(typeof body[0].suggested_price).toBe("number");
    expect(body[0].created_at).toBe("2025-01-01T00:00:00.000Z");
  });

  it("returns 500 when the database query fails", async () => {
    withUser(null);
    prismaMock.documents.findMany.mockRejectedValue(new Error("db down"));

    const res = await listDocuments();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to fetch documents" });
  });
});

describe("GET /api/documents — per-user ownership (isOwned)", () => {
  it("marks a document owned when the user has an active submission", async () => {
    withUser(authedUser);
    prismaMock.documents.findMany.mockResolvedValue([
      dbRow({ submissions: [{ id: "sub-1" }] }),
    ]);

    const res = await listDocuments();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].isOwned).toBe(true);
  });

  it("marks a document not owned when the user has no active submission", async () => {
    withUser(authedUser);
    prismaMock.documents.findMany.mockResolvedValue([dbRow({ submissions: [] })]);

    const res = await listDocuments();

    const body = await res.json();
    expect(body[0].isOwned).toBe(false);
  });

  it("decides ownership from the user's ACTIVE submissions only", async () => {
    withUser(authedUser);
    prismaMock.documents.findMany.mockResolvedValue([
      dbRow({ submissions: [{ id: "sub-1" }] }),
    ]);

    await listDocuments();

    // The ownership join must be scoped to this user AND active submissions —
    // a refunded/revoked (non-active) submission must not grant ownership.
    expect(prismaMock.documents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          submissions: {
            where: { user_id: authedUser.id, status: "active" },
            select: { id: true },
          },
        },
      }),
    );
  });

  it("returns isOwned=false for an anonymous request and does not join submissions", async () => {
    withUser(null);
    prismaMock.documents.findMany.mockResolvedValue([dbRow()]);

    const res = await listDocuments();

    const body = await res.json();
    expect(body[0].isOwned).toBe(false);
    // Anonymous → no per-user submission join is requested.
    const callArg = prismaMock.documents.findMany.mock.calls[0][0];
    expect(callArg.include).toBeUndefined();
  });
});

describe("GET /api/documents/[id]", () => {
  const call = (id: string) =>
    getDocument(new Request(`http://localhost/api/documents/${id}`), {
      params: Promise.resolve({ id }),
    });

  it("returns 200 and the document for a valid id", async () => {
    prismaMock.documents.findUnique.mockResolvedValue({
      id: 1,
      title: "Sample Doc",
      description: "A sample document",
      file_url: "docs/sample.pdf",
      category: "guides",
      suggested_price: { toString: () => "9.99" } as never,
      created_at: new Date("2025-01-01T00:00:00.000Z"),
    });

    const res = await call("1");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(1);
    expect(prismaMock.documents.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it("returns 404 when the document does not exist", async () => {
    prismaMock.documents.findUnique.mockResolvedValue(null);

    const res = await call("999999");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Document not found" });
  });

  it("returns 400 when the id is not a number", async () => {
    const res = await call("abc");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid document ID" });
    // Never queried the DB for an invalid id.
    expect(prismaMock.documents.findUnique).not.toHaveBeenCalled();
  });
});
