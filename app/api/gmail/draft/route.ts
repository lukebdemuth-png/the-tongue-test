import { NextResponse } from "next/server";

import { createGmailDraft } from "@/lib/gmail";
import { readGmailSession } from "@/lib/gmail-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const sessionId = await readGmailSession();
    if (!sessionId) throw new Error("Connect Gmail before creating a draft.");
    const result = await createGmailDraft(sessionId, await request.json());
    return NextResponse.json({ ok: true, message: "Draft created in Gmail.", draftId: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create Gmail draft.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
