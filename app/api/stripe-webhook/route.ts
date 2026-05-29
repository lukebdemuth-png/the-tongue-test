import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { saveStripeEvent } from "@/lib/stripe-events";

export const runtime = "nodejs";

const WEBHOOK_TOLERANCE_SECONDS = 300;

function parseStripeSignature(header: string) {
  const parts = header.split(",").reduce<Record<string, string[]>>((acc, item) => {
    const [key, value] = item.split("=");
    if (!key || !value) return acc;
    acc[key] = [...(acc[key] ?? []), value];
    return acc;
  }, {});

  const timestamp = Number(parts.t?.[0]);
  const signatures = parts.v1 ?? [];
  if (!Number.isFinite(timestamp) || !signatures.length) throw new Error("Invalid Stripe signature header.");
  return { timestamp, signatures };
}

function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string) {
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  const age = Math.abs(Date.now() / 1000 - timestamp);
  if (age > WEBHOOK_TOLERANCE_SECONDS) throw new Error("Stripe webhook timestamp is outside the allowed tolerance.");

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  const matched = signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, "hex");
    return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
  });

  if (!matched) throw new Error("Stripe webhook signature verification failed.");
}

function checkoutSessionFromEvent(event: any) {
  if (event?.type !== "checkout.session.completed") return null;
  const session = event?.data?.object;
  if (!session || typeof session !== "object") return null;
  return session as Record<string, any>;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "STRIPE_WEBHOOK_SECRET is not configured." }, { status: 500 });
  }

  const signatureHeader = request.headers.get("stripe-signature");
  if (!signatureHeader) {
    return NextResponse.json({ ok: false, error: "Missing Stripe signature." }, { status: 400 });
  }

  try {
    const rawBody = await request.text();
    verifyStripeSignature(rawBody, signatureHeader, webhookSecret);

    const event = JSON.parse(rawBody);
    const session = checkoutSessionFromEvent(event);
    await saveStripeEvent({
      stripeEventId: String(event.id ?? ""),
      eventType: String(event.type ?? ""),
      livemode: Boolean(event.livemode),
      checkoutSessionId: session ? String(session.id ?? "") : undefined,
      customerEmail: session ? String(session.customer_details?.email ?? session.customer_email ?? "") || undefined : undefined,
      plan: session ? String(session.metadata?.plan ?? "") || undefined : undefined,
      paymentStatus: session ? String(session.payment_status ?? session.status ?? "") || undefined : undefined,
      raw: event,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not process Stripe webhook.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
