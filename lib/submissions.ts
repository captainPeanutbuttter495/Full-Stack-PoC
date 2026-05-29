import { prisma } from "@/lib/prisma";

export const createSubmission = async (
  document_id: number,
  amount: number,
  user_id: string | null,
  stripe_session_id?: string,
) => {
  try {
    const submission = await prisma.submissions.create({
      data: {
        document_id,
        amount,
        user_id,
        ...(stripe_session_id ? { stripe_session_id } : {}),
      },
    });

    return {
      ...submission,
      amount: Number(submission.amount),
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

export const checkSubmission = async (document_id: number, user_id: string) => {
  try {
    const submission = await prisma.submissions.findFirst({
      where: { document_id, user_id },
    });

    if (!submission) {
      return new Error("Submission not found");
    }

    return {
      ...submission,
      created_at: submission.created_at
        ? submission.created_at.toISOString()
        : null,
    };
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}