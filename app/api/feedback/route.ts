import { NextResponse } from "next/server";

import { normalizeFeedbackSubmission, saveFeedbackSubmission } from "@/lib/feedback";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const submission = normalizeFeedbackSubmission(await request.json());
    const result = await saveFeedbackSubmission(submission);
    return NextResponse.json({
      ok: true,
      mode: result.mode,
      message: "Thanks. Your feedback was sent.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send feedback.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
