import { NextResponse } from "next/server";

import { hasGmailConnection } from "@/lib/gmail";
import { readGmailSession } from "@/lib/gmail-session";

export const runtime = "nodejs";

export async function GET() {
  const sessionId = await readGmailSession();
  const connected = await hasGmailConnection(sessionId);
  return NextResponse.json({ ok: true, connected });
}
