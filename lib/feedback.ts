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
