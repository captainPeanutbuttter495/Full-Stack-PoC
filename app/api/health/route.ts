import { NextResponse } from "next/server";

// Liveness/readiness probe endpoint for Kubernetes (and any other orchestrator).
// Intentionally dependency-free: no database, Supabase, or Stripe calls, so a
// probe never fails because a downstream service is slow. The timestamp lets an
// operator confirm the response is live rather than cached.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
