import { NextResponse } from "next/server";

import { handleGoogleOAuthCallback } from "@/lib/gmail";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      throw new Error("Missing Gmail OAuth callback information.");
    }

    const result = await handleGoogleOAuthCallback(code, state);
    const redirectUrl = new URL(result.returnTo || "/", url.origin);
    redirectUrl.searchParams.set("gmail", "connected");
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const url = new URL(request.url);
    const redirectUrl = new URL("/", url.origin);
    redirectUrl.searchParams.set("gmail", "error");
    return NextResponse.redirect(redirectUrl);
  }
}
