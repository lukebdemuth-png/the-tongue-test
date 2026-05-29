import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type StripeEventRecord = {
  stripeEventId: string;
  eventType: string;
  livemode?: boolean;
  checkoutSessionId?: string;
  customerEmail?: string;
  plan?: string;
  paymentStatus?: string;
  raw?: unknown;
};

async function writeLocalStripeEvent(record: StripeEventRecord) {
  const filePath = process.env.STRIPE_EVENT_FILE_PATH || path.join(process.cwd(), "logs", "stripe_events.jsonl");
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(
    filePath,
    `${JSON.stringify({
      ...record,
      received_at: new Date().toISOString(),
    })}\n`,
    "utf8",
  );
}

async function writeSupabaseStripeEvent(record: StripeEventRecord) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_STRIPE_EVENTS_TABLE || "stripe_events";
  if (!url || !serviceRoleKey) return false;

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}?on_conflict=stripe_event_id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify({
      stripe_event_id: record.stripeEventId,
      event_type: record.eventType,
      livemode: record.livemode ?? null,
      checkout_session_id: record.checkoutSessionId ?? null,
      customer_email: record.customerEmail ?? null,
      plan: record.plan ?? null,
      payment_status: record.paymentStatus ?? null,
      raw_event: record.raw ?? null,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase Stripe event insert failed: ${detail || response.statusText}`);
  }

  return true;
}

export async function saveStripeEvent(record: StripeEventRecord) {
  const wroteToSupabase = await writeSupabaseStripeEvent(record);
  if (wroteToSupabase) return { ok: true, mode: "supabase" as const };
  await writeLocalStripeEvent(record);
  return { ok: true, mode: "local" as const };
}
