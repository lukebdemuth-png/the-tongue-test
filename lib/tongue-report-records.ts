import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export type TongueReportRecord = {
  accessChoice?: string;
  primaryTitle: string;
  primarySummary?: string;
  organPriorities?: unknown;
  patternScores?: unknown;
  visibleSigns?: unknown;
  intakeHighlights?: unknown;
  notes?: string;
  source?: string;
};

export function normalizeTongueReportRecord(value: unknown): TongueReportRecord {
  if (!value || typeof value !== "object") throw new Error("Report record must be an object.");
  const input = value as Record<string, unknown>;
  const primaryTitle = String(input.primaryTitle ?? "").trim().slice(0, 180);
  if (!primaryTitle) throw new Error("Report record needs a primary title.");

  return {
    accessChoice: String(input.accessChoice ?? "").trim().slice(0, 40) || undefined,
    primaryTitle,
    primarySummary: String(input.primarySummary ?? "").trim().slice(0, 1200) || undefined,
    organPriorities: input.organPriorities ?? null,
    patternScores: input.patternScores ?? null,
    visibleSigns: input.visibleSigns ?? null,
    intakeHighlights: input.intakeHighlights ?? null,
    notes: String(input.notes ?? "").trim().slice(0, 1200) || undefined,
    source: String(input.source ?? "tongue-assessment").trim().slice(0, 120) || "tongue-assessment",
  };
}

async function writeLocalReport(record: TongueReportRecord) {
  const filePath = process.env.TONGUE_REPORT_FILE_PATH || path.join(process.cwd(), "logs", "tongue_report_records.jsonl");
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(
    filePath,
    `${JSON.stringify({
      ...record,
      created_at: new Date().toISOString(),
    })}\n`,
    "utf8",
  );
}

async function writeSupabaseReport(record: TongueReportRecord) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_TONGUE_REPORTS_TABLE || "tongue_report_records";
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
      access_choice: record.accessChoice ?? null,
      primary_title: record.primaryTitle,
      primary_summary: record.primarySummary ?? null,
      organ_priorities: record.organPriorities ?? null,
      pattern_scores: record.patternScores ?? null,
      visible_signs: record.visibleSigns ?? null,
      intake_highlights: record.intakeHighlights ?? null,
      notes: record.notes ?? null,
      source: record.source ?? "tongue-assessment",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase report insert failed: ${detail || response.statusText}`);
  }

  return true;
}

export async function saveTongueReportRecord(record: TongueReportRecord) {
  const wroteToSupabase = await writeSupabaseReport(record);
  if (wroteToSupabase) return { ok: true, mode: "supabase" as const };
  await writeLocalReport(record);
  return { ok: true, mode: "local" as const };
}
