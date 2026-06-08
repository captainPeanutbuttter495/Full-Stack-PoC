import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkSubmission } from "@/lib/submissions";
import { getDocumentById } from "@/lib/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;
    const document_id = parseInt(documentId, 10);

    if (isNaN(document_id)) {
      return NextResponse.json(
        { error: "Invalid document ID" },
        { status: 400 },
      );
    }

    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Ownership check
    const submission = await checkSubmission(document_id, user.id);
    if (submission instanceof Error) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Fetch document for file_url
    const document = await getDocumentById(document_id);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (document instanceof Error) {
      return NextResponse.json(
        { error: "Error fetching document" },
        { status: 500 },
      );
    }

    // 4. Generate 1-hour signed URL via service-role client
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("documents")
      .createSignedUrl(document.file_url, 3600);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: "Could not generate download link" },
        { status: 500 },
      );
    }

    // 5. Return signed URL
    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
