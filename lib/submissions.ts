import { prisma } from "@/lib/prisma";

export const createSubmission = async (
  document_id: number,
  amount: number,
  user_id: string | null,
) => {
  try {
    const submission = await prisma.submissions.create({
      data: {
        document_id,
        amount,
        user_id,
      },
    });

    return {
      ...submission,
      created_at: submission.created_at
        ? submission.created_at.toISOString()
        : null,
    };
  } catch (error) {
    // P2003 = foreign key constraint failed → document_id doesn't exist
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return new Error("Document not found");
    }
    return error instanceof Error ? error : new Error(String(error));
  }
};
