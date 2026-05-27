"use server";
import { prisma } from "./prisma";

export const getAllDocuments = async () => {
  try {
    const docs = await prisma.documents.findMany({
      orderBy: { created_at: "desc" },
    });

    // Serialize Prisma-specific types to plain JS values so the rest of
    // the app (and lib/types.ts) doesn't need to know about Decimal/Date.
    return docs.map((doc) => ({
      ...doc,
      suggested_price: doc.suggested_price ? Number(doc.suggested_price) : null,
      created_at: doc.created_at ? doc.created_at.toISOString() : null,
    }));
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
};

export const getDocumentById = async (id: number) => {
  try {
    const doc = await prisma.documents.findUnique({
      where: { id },
    });

    return doc ? {
      ...doc,
      suggested_price: doc.suggested_price ? Number(doc.suggested_price) : null,
      created_at: doc.created_at ? doc.created_at.toISOString() : null,
    } : null;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}
