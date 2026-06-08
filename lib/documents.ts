"use server";
import { prisma } from "./prisma";

export const getAllDocuments = async (userId: string | null = null) => {
  try {
    const docs = await prisma.documents.findMany({
      orderBy: { created_at: "desc" },
      include: userId
        ? {
            submissions: {
              where: { user_id: userId, status: "active" },
              select: { id: true },
            },
          }
        : undefined,
    });

    return docs.map((doc) => {
      const { submissions, ...rest } = doc as typeof doc & {
        submissions?: { id: string }[];
      };
      return {
        ...rest,
        suggested_price: doc.suggested_price
          ? Number(doc.suggested_price)
          : null,
        created_at: doc.created_at ? doc.created_at.toISOString() : null,
        isOwned: submissions ? submissions.length > 0 : false,
      };
    });
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
};

export const getDocumentById = async (id: number) => {
  try {
    const doc = await prisma.documents.findUnique({
      where: { id },
    });

    return doc
      ? {
          ...doc,
          suggested_price: doc.suggested_price
            ? Number(doc.suggested_price)
            : null,
          created_at: doc.created_at ? doc.created_at.toISOString() : null,
          isOwned: false,
        }
      : null;
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
};
