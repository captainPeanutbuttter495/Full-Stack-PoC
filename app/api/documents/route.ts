import { NextResponse } from "next/server";
import { getAllDocuments } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const documents = await getAllDocuments(user?.id ?? null);
  if (documents instanceof Error) {
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
  return NextResponse.json(documents);
}
