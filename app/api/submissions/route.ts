import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubmission } from "@/lib/submissions";

export async function POST(request: Request) {
  try {
    console.log("Received submission request");
    const { document_id, amount } = await request.json();

    if (typeof document_id !== "number" || typeof amount !== "number") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const user_id = user?.id ?? null;

    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submission = await createSubmission(document_id, amount, user_id);

    if (submission instanceof Error) {
      if (submission.message === "Document not found") {
        return NextResponse.json(
          { error: submission.message },
          { status: 404 },
        );
      }
      throw submission;
    }

    return NextResponse.json(
      {
        ...submission,
        download_url: `/api/download/${submission.document_id}`,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
