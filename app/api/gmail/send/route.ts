import { NextResponse } from "next/server";

import { sendGmailMessage } from "@/lib/gmail";
import { readGmailSession } from "@/lib/gmail-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const sessionId = await readGmailSession();
    if (!sessionId) throw new Error("Connect Gmail before sending.");
    const body = await request.json();
    if (body.confirmSend !== true) {
      throw new Error("Confirm send is required before sending Gmail messages.");
    }
    const { confirmSend: _confirmSend, ...payload } = body;
    const result = await sendGmailMessage(sessionId, payload);
    return NextResponse.json({ ok: true, message: "Email sent.", messageId: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send Gmail message.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
