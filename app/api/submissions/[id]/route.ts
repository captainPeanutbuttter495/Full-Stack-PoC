import { NextResponse } from "next/server";
import { checkSubmission } from "@/lib/submissions";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const document_id = parseInt(id, 10);

    if (isNaN(document_id)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id ?? null;

    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submission = await checkSubmission(document_id, user_id);

    if (submission instanceof Error) {
      if (submission.message === "Submission not found") {
        return NextResponse.json({ owned: false });
      }
      throw submission;
    }

    return NextResponse.json({ owned: true, submission });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
