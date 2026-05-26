import { NextResponse } from "next/server";

import { revokeGmailAccess } from "@/lib/gmail";
import { readGmailSession } from "@/lib/gmail-session";

export const runtime = "nodejs";

export async function POST() {
  try {
    const sessionId = await readGmailSession();
    if (sessionId) await revokeGmailAccess(sessionId);
    return NextResponse.json({ ok: true, message: "Gmail disconnected." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not disconnect Gmail.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
