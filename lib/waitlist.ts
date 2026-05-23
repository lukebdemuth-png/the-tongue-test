import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type WaitlistSubmission = {
  email: string;
  name?: string;
  interest?: string;
  source?: string;
};

export type WaitlistResult = {
  ok: true;
  mode: "supabase" | "local";
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeWaitlistSubmission(value: unknown): WaitlistSubmission {
  if (!value || typeof value !== "object") {
    throw new Error("Submission must be an object.");
  }
  const input = value as Record<string, unknown>;
  const email = String(input.email ?? "").trim().toLowerCase();
  if (!emailPattern.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  return {
    email,
    name: String(input.name ?? "").trim().slice(0, 120) || undefined,
    interest: String(input.interest ?? "").trim().slice(0, 500) || undefined,
    source: String(input.source ?? "landing-page").trim().slice(0, 120) || "landing-page",
  };
}

async function writeLocalSubmission(submission: WaitlistSubmission) {
  const filePath = process.env.WAITLIST_FILE_PATH || path.join(process.cwd(), "logs", "waitlist_submissions.jsonl");
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(
    filePath,
    `${JSON.stringify({
      ...submission,
      submitted_at: new Date().toISOString(),
    })}\n`,
    "utf8",
  );
}

async function writeSupabaseSubmission(submission: WaitlistSubmission) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_WAITLIST_TABLE || "waitlist_subscribers";
  if (!url || !serviceRoleKey) return false;

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      email: submission.email,
      name: submission.name ?? null,
      interest: submission.interest ?? null,
      source: submission.source ?? "landing-page",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase waitlist insert failed: ${detail || response.statusText}`);
  }
  return true;
}

async function notifyViaResend(submission: WaitlistSubmission) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.WAITLIST_NOTIFY_EMAIL;
  const from = process.env.WAITLIST_FROM_EMAIL || "waitlist@patterns.app";
  if (!apiKey || !to) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "New Patterns waitlist signup",
      text: [
        `Email: ${submission.email}`,
        `Name: ${submission.name ?? ""}`,
        `Interest: ${submission.interest ?? ""}`,
        `Source: ${submission.source ?? "landing-page"}`,
      ].join("\n"),
    }),
  });
}

export async function saveWaitlistSubmission(submission: WaitlistSubmission): Promise<WaitlistResult> {
  const wroteToSupabase = await writeSupabaseSubmission(submission);
  if (wroteToSupabase) {
    await notifyViaResend(submission);
    return { ok: true, mode: "supabase" };
  }
  await writeLocalSubmission(submission);
  await notifyViaResend(submission);
  return { ok: true, mode: "local" };
}
