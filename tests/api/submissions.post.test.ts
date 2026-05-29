import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  makeSupabaseClient,
  authedUser,
  postSubmission,
  fkViolation,
} from "./_helpers";

// Mock Prisma — `createSubmission` (in lib/submissions.ts) calls
// `prisma.submissions.create`. We assert on that call rather than a real DB.
const prismaMock = vi.hoisted(() => ({
  submissions: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

// Mock Supabase auth so we can control the authenticated user per test.
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { POST } from "@/app/api/submissions/route";
import { createClient } from "@/lib/supabase/server";

const mockedCreateClient = vi.mocked(createClient);

/**
 * Make `createClient()` resolve to a client with the given (or no) user.
 * Returns the mocked client so tests can assert on `auth.getUser`.
 */
function withUser(user: { id: string } | null) {
  const client = makeSupabaseClient(user);
  mockedCreateClient.mockResolvedValue(client as never);
  return client;
}

/** A successful Prisma create result for document 1 / $5.00. */
function createdRow() {
  return {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    document_id: 1,
    user_id: authedUser.id,
    amount: { toString: () => "5" } as never,
    created_at: new Date("2025-01-01T00:00:00.000Z"),
  };
}

beforeEach(() => {
  // resetAllMocks clears both call history AND mocked implementations, so each
  // test must define its own Prisma/Supabase behavior — no leakage between tests.
  vi.resetAllMocks();
});

describe("POST /api/submissions — valid submission", () => {
  it("returns 201 Created with a download_url", async () => {
    withUser(authedUser);
    prismaMock.submissions.create.mockResolvedValue(createdRow());

    const res = await POST(postSubmission({ document_id: 1, amount: 5 }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.download_url).toBe("/api/download/1");
  });

  it("authenticates the user before creating the submission", async () => {
    const client = withUser(authedUser);
    prismaMock.submissions.create.mockResolvedValue(createdRow());

    await POST(postSubmission({ document_id: 1, amount: 5 }));

    // Auth was consulted, and it happened (the create only runs once auth passes).
    expect(mockedCreateClient).toHaveBeenCalledTimes(1);
    expect(client.auth.getUser).toHaveBeenCalledTimes(1);
    expect(prismaMock.submissions.create).toHaveBeenCalledTimes(1);
  });

  it("creates a submission record with the expected fields", async () => {
    withUser(authedUser);
    prismaMock.submissions.create.mockResolvedValue(createdRow());

    await POST(postSubmission({ document_id: 1, amount: 5 }));

    expect(prismaMock.submissions.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.submissions.create).toHaveBeenCalledWith({
      data: { document_id: 1, amount: 5, user_id: authedUser.id },
    });
  });
});

describe("POST /api/submissions — validation failures (no record created)", () => {
  it("returns 400 for amount of 0", async () => {
    withUser(authedUser);

    const res = await POST(postSubmission({ document_id: 1, amount: 0 }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Amount must be greater than zero",
    });
    expect(prismaMock.submissions.create).not.toHaveBeenCalled();
  });

  it("returns 400 for a negative amount", async () => {
    withUser(authedUser);

    const res = await POST(postSubmission({ document_id: 1, amount: -1 }));

    expect(res.status).toBe(400);
    expect(prismaMock.submissions.create).not.toHaveBeenCalled();
  });

  it("returns 400 when document_id is missing", async () => {
    withUser(authedUser);

    const res = await POST(postSubmission({ amount: 5 }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid input" });
    expect(prismaMock.submissions.create).not.toHaveBeenCalled();
  });

  it("returns 400 when amount is missing", async () => {
    withUser(authedUser);

    const res = await POST(postSubmission({ document_id: 1 }));

    expect(res.status).toBe(400);
    expect(prismaMock.submissions.create).not.toHaveBeenCalled();
  });

  it("validates input BEFORE checking auth (malformed → 400, auth not consulted)", async () => {
    withUser(null);

    const res = await POST(postSubmission({ amount: 5 })); // missing document_id

    expect(res.status).toBe(400);
    // Auth check is never reached for a malformed body.
    expect(mockedCreateClient).not.toHaveBeenCalled();
    expect(prismaMock.submissions.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/submissions — auth & document existence", () => {
  it("returns 401 for a valid-looking but unauthenticated request", async () => {
    withUser(null);

    const res = await POST(postSubmission({ document_id: 1, amount: 5 }));

    expect(res.status).toBe(401);
    expect(prismaMock.submissions.create).not.toHaveBeenCalled();
  });

  it("returns 404 when the document does not exist (Prisma P2003)", async () => {
    withUser(authedUser);
    prismaMock.submissions.create.mockRejectedValue(fkViolation());

    const res = await POST(postSubmission({ document_id: 999999, amount: 5 }));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Document not found" });
  });
});
