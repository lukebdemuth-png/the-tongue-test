import { NextResponse } from "next/server";

import { createStripeCheckoutSession, type StripeCheckoutPlan } from "@/lib/stripe-checkout";

export const runtime = "nodejs";

const plans = new Set<StripeCheckoutPlan>(["trial", "one-time"]);

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const plan = String(input?.plan ?? "") as StripeCheckoutPlan;
    if (!plans.has(plan)) {
      return NextResponse.json({ ok: false, error: "Choose a valid checkout option." }, { status: 400 });
    }

    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const origin = configuredOrigin || new URL(request.url).origin;
    const session = await createStripeCheckoutSession({ plan, origin });

    if (session.demoAccess) {
      return NextResponse.json({
        ok: true,
        demoAccess: true,
        message: session.message,
      });
    }

    if (!session.url) {
      return NextResponse.json({ ok: false, error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start checkout.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
