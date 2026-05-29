import { NextResponse } from "next/server";
import { getAllDocuments } from "@/lib/documents";

export async function GET() {
  const documents = await getAllDocuments();
  if (documents instanceof Error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
  return NextResponse.json(documents);
}
