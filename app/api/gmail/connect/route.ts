import { NextResponse } from "next/server";

import { getGoogleOAuthUrl } from "@/lib/gmail";
import { getGmailSession } from "@/lib/gmail-session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const sessionId = await getGmailSession();
    const url = new URL(request.url);
    const returnTo = url.searchParams.get("returnTo") || "/";
    const oauth = getGoogleOAuthUrl({ sessionId, returnTo });
    return NextResponse.redirect(oauth.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Gmail connection.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
