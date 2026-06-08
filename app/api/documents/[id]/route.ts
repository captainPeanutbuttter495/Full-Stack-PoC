import { NextResponse } from "next/server";
import { getDocumentById } from "@/lib/documents";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  const document = await getDocumentById(id);
  if (document instanceof Error) {
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 },
    );
  }
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}
