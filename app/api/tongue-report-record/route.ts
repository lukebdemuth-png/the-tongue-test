import { NextResponse } from "next/server";

import { normalizeTongueReportRecord, saveTongueReportRecord } from "@/lib/tongue-report-records";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const record = normalizeTongueReportRecord(await request.json());
    const result = await saveTongueReportRecord(record);
    return NextResponse.json({ ok: true, mode: result.mode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save report record.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
