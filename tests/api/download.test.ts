import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  makeSupabaseClient,
  authedUser,
  makeDocument,
  makeAdminClient,
} from "./_helpers";

/**
 * GET /api/download/[documentId] — the access-control boundary for paid
 * downloads. It issues a short-lived signed Supabase URL ONLY to an
 * authenticated user who has an active (paid, non-refunded) submission.
 *
 * Mocked layers: Supabase auth client, Supabase service-role (admin) client,
 * Prisma (drives the real `checkSubmission`), and the document lookup helper.
 *
 * `checkSubmission` filters on `status: "active"`, so a refunded/revoked
 * submission does not match → the user is treated as not owning the document.
 */

const prismaMock = vi.hoisted(() => ({
  submissions: { findFirst: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/documents", () => ({ getDocumentById: vi.fn() }));

import { GET } from "@/app/api/download/[documentId]/route";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDocumentById } from "@/lib/documents";

const mockedCreateClient = vi.mocked(createClient);
const mockedCreateAdminClient = vi.mocked(createAdminClient);
const mockedGetDocumentById = vi.mocked(getDocumentById);

function withUser(user: { id: string } | null) {
  mockedCreateClient.mockResolvedValue(makeSupabaseClient(user) as never);
}

/** Call the GET handler with the dynamic `documentId` param (a Promise in Next 16). */
function getDownload(documentId: string) {
  return GET(new Request("http://localhost/api/download/" + documentId), {
    params: Promise.resolve({ documentId }),
  });
}

/** An active submission row (what checkSubmission's findFirst returns when owned). */
function activeSubmission() {
  return {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    document_id: 1,
    user_id: authedUser.id,
    status: "active",
    created_at: new Date("2025-01-01T00:00:00.000Z"),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/download/[documentId] — input & auth", () => {
  it("returns 400 for a non-numeric document id", async () => {
    const res = await getDownload("abc");

    expect(res.status).toBe(400);
    // Never reached the auth/ownership/storage layers.
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated and never reaches ownership or storage", async () => {
    withUser(null);

    const res = await getDownload("1");

    expect(res.status).toBe(401);
    // Guardrail: no ownership lookup and no signed URL for anonymous users.
    expect(prismaMock.submissions.findFirst).not.toHaveBeenCalled();
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });
});

describe("GET /api/download/[documentId] — ownership gating", () => {
  it("returns 403 with no signed URL when the user has no active submission", async () => {
    withUser(authedUser);
    prismaMock.submissions.findFirst.mockResolvedValue(null);

    const res = await getDownload("1");

    expect(res.status).toBe(403);
    // Guardrail: a user without a paid submission gets no download link.
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  it("returns 403 for a refunded/revoked submission (active-only filter)", async () => {
    // checkSubmission queries `status: "active"`, so a refunded row simply does
    // not match and findFirst returns null. Assert the active filter is applied.
    withUser(authedUser);
    prismaMock.submissions.findFirst.mockResolvedValue(null);

    const res = await getDownload("1");

    expect(res.status).toBe(403);
    expect(prismaMock.submissions.findFirst).toHaveBeenCalledWith({
      where: { document_id: 1, user_id: authedUser.id, status: "active" },
    });
    // Guardrail: revoked access yields no signed URL.
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });
});

describe("GET /api/download/[documentId] — document & signed URL", () => {
  it("returns 404 when the owned document no longer exists", async () => {
    withUser(authedUser);
    prismaMock.submissions.findFirst.mockResolvedValue(activeSubmission());
    mockedGetDocumentById.mockResolvedValue(null);

    const res = await getDownload("1");

    expect(res.status).toBe(404);
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  it("returns a 1-hour signed URL for an authenticated owner", async () => {
    withUser(authedUser);
    prismaMock.submissions.findFirst.mockResolvedValue(activeSubmission());
    mockedGetDocumentById.mockResolvedValue(makeDocument({ file_url: "docs/sample.pdf" }));
    const { adminClient, from, createSignedUrl } = makeAdminClient({
      data: { signedUrl: "https://storage.example/signed/sample.pdf" },
      error: null,
    });
    mockedCreateAdminClient.mockReturnValue(adminClient as never);

    const res = await getDownload("1");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      signedUrl: "https://storage.example/signed/sample.pdf",
    });
    expect(from).toHaveBeenCalledWith("documents");
    expect(createSignedUrl).toHaveBeenCalledWith("docs/sample.pdf", 3600);
  });

  it("returns 500 when the signed URL cannot be generated", async () => {
    withUser(authedUser);
    prismaMock.submissions.findFirst.mockResolvedValue(activeSubmission());
    mockedGetDocumentById.mockResolvedValue(makeDocument());
    const { adminClient } = makeAdminClient({
      data: null,
      error: new Error("storage failure"),
    });
    mockedCreateAdminClient.mockReturnValue(adminClient as never);

    const res = await getDownload("1");

    expect(res.status).toBe(500);
  });
});
