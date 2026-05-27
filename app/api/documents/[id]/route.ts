import {NextResponse} from "next/server"
import {getDocumentById} from "@/lib/documents"

export async function GET(request: Request, {params}: {params: {id: string}}) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({error: "Invalid document ID"}, {status: 400});
  }

  const document = await getDocumentById(id);
  if (!document) {
    return NextResponse.json({error: "Document not found"}, {status: 404});
  }

  return NextResponse.json(document);
}