import { execFileSync } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const intake = await request.json();
    const output = execFileSync("python3", ["src/pattern_app_brain.py", "--stdin", "--limit", "3"], {
      cwd: process.cwd(),
      input: JSON.stringify(intake),
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 16,
    });
    return NextResponse.json(JSON.parse(output));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Pattern App brain error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
