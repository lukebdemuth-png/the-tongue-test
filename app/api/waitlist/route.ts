import { NextResponse } from "next/server";

import { normalizeWaitlistSubmission, saveWaitlistSubmission } from "@/lib/waitlist";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const submission = normalizeWaitlistSubmission(await request.json());
    const result = await saveWaitlistSubmission(submission);
    return NextResponse.json({
      ok: true,
      mode: result.mode,
      message: "You are on the waitlist.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not join the waitlist.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
