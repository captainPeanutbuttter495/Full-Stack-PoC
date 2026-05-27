import { NextResponse } from "next/server";
import { createSubmission } from "@/lib/submissions";

export async function POST(request: Request) {
  try {
    const { document_id, amount, email } = await request.json();

    if (typeof document_id !== "number" || typeof amount !== "number") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero" },
        { status: 400 },
      );
    }

    const submission = await createSubmission(document_id, amount, email);

    if (submission instanceof Error) {
      if (submission.message === "Document not found") {
        return NextResponse.json({ error: submission.message }, { status: 404 });
      }
      throw submission;
    }

    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
