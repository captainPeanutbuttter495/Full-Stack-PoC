import { describe, it, expect, beforeEach, vi } from "vitest";

// Mocked Prisma client. `vi.hoisted` makes the mock object exist before the
// `vi.mock` factory below replaces the real `@/lib/prisma` module.
const prismaMock = vi.hoisted(() => ({
  documents: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

// Import the handlers AFTER the mock is registered.
import { GET as listDocuments } from "@/app/api/documents/route";
import { GET as getDocument } from "@/app/api/documents/[id]/route";

beforeEach(() => {
  // resetAllMocks clears both call history AND mocked implementations, so each
  // test must define its own Prisma behavior — no leakage between tests.
  vi.resetAllMocks();
});

describe("GET /api/documents", () => {
  it("returns 200 and an array of documents", async () => {
    const dbRow = {
      id: 1,
      title: "Sample Doc",
      description: "A sample document",
      file_url: "docs/sample.pdf",
      category: "guides",
      // lib/documents.ts serializes these:
      suggested_price: { toString: () => "9.99" } as never,
      created_at: new Date("2025-01-01T00:00:00.000Z"),
    };
    prismaMock.documents.findMany.mockResolvedValue([dbRow]);

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
    prismaMock.documents.findMany.mockRejectedValue(new Error("db down"));

    const res = await listDocuments();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to fetch documents" });
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
