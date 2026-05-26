import { cookies } from "next/headers";

import { getOrCreateGmailSessionId } from "@/lib/gmail";

const gmailSessionCookie = "tongue_test_gmail_session";

export async function getGmailSession() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(gmailSessionCookie)?.value;
  const sessionId = getOrCreateGmailSessionId(existing);
  if (!existing) {
    cookieStore.set(gmailSessionCookie, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return sessionId;
}

export async function readGmailSession() {
  const cookieStore = await cookies();
  return cookieStore.get(gmailSessionCookie)?.value;
}
