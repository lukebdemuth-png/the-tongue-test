import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type FeedbackSubmission = {
  message: string;
  email?: string;
  source?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeFeedbackSubmission(value: unknown): FeedbackSubmission {
  if (!value || typeof value !== "object") {
    throw new Error("Feedback must be an object.");
  }

  const input = value as Record<string, unknown>;
  const message = String(input.message ?? "").trim().slice(0, 2000);
  const email = String(input.email ?? "").trim().toLowerCase();

  if (message.length < 8) {
    throw new Error("Add a little more detail before sending feedback.");
  }
  if (email && !emailPattern.test(email)) {
    throw new Error("Enter a valid email address or leave it blank.");
  }

  return {
    message,
    email: email || undefined,
    source: String(input.source ?? "tongue-test").trim().slice(0, 120) || "tongue-test",
  };
}

export async function saveFeedbackSubmission(submission: FeedbackSubmission) {
  const wroteToSupabase = await writeSupabaseFeedback(submission);
  if (wroteToSupabase) return { ok: true, mode: "supabase" as const };

  const filePath = process.env.FEEDBACK_FILE_PATH || path.join(process.cwd(), "logs", "feedback_submissions.jsonl");
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(
    filePath,
    `${JSON.stringify({
      ...submission,
      submitted_at: new Date().toISOString(),
    })}\n`,
    "utf8",
  );

  return { ok: true, mode: "local" as const };
}

async function writeSupabaseFeedback(submission: FeedbackSubmission) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_FEEDBACK_TABLE || "app_feedback";
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
      email: submission.email ?? null,
      message: submission.message,
      source: submission.source ?? "tongue-test",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase feedback insert failed: ${detail || response.statusText}`);
  }

  return true;
}
