#!/usr/bin/env node

const baseUrl = (process.env.TONGUE_TEST_BASE_URL || "https://the-tongue-test.vercel.app").replace(/\/$/, "");

const checks = [];

function addCheck(name, run) {
  checks.push({ name, run });
}

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 500) };
  }
}

function classifyFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/SUPABASE_SERVICE_ROLE_KEY|SUPABASE_URL/i.test(message)) {
    return "BLOCKED: Supabase server env is not fully configured in Vercel.";
  }
  if (/STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|Stripe/i.test(message)) {
    return "BLOCKED: Stripe secret/webhook env is not fully configured in Vercel.";
  }
  if (/RESEND_API_KEY|Report email failed/i.test(message)) {
    return "BLOCKED: Resend email configuration needs attention.";
  }
  return `FAIL: ${message}`;
}

async function postJson(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJson(response);
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || data?.message || `${response.status} ${response.statusText}`);
  }
  return data;
}

addCheck("Live tongue assessment page", async () => {
  const response = await fetch(`${baseUrl}/tongue-assessment`, { method: "HEAD" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return `OK: ${response.status}`;
});

addCheck("Waitlist write", async () => {
  const email = `codex-launch-${Date.now()}@example.com`;
  const data = await postJson("/api/waitlist", {
    email,
    source: "codex-launch-check",
    interest: "Automated production launch check.",
  });
  return `OK: ${data.mode || "accepted"}`;
});

addCheck("Feedback write", async () => {
  const data = await postJson("/api/feedback", {
    email: "codex-launch-feedback@example.com",
    message: "Automated Tongue Test TCM production launch check.",
    source: "codex-launch-check",
  });
  return `OK: ${data.mode || "accepted"}`;
});

addCheck("Tongue report record write", async () => {
  const data = await postJson("/api/tongue-report-record", {
    accessChoice: "launch-check",
    primaryTitle: "Codex Launch Check Pattern",
    primarySummary: "Automated production launch check only.",
    organPriorities: { primary: ["Spleen", "Stomach"], secondary: ["Liver"] },
    patternScores: [{ title: "Dampness", score: 62 }],
    visibleSigns: ["launch check"],
    intakeHighlights: [{ question: "Launch check", answer: "Automated payload" }],
    source: "codex-launch-check",
  });
  return `OK: ${data.mode || "accepted"}`;
});

addCheck("Stripe one-time checkout", async () => {
  const data = await postJson("/api/stripe-checkout", { plan: "one-time" });
  if (!data.url && !data.demoAccess) throw new Error("Stripe checkout did not return a URL.");
  return data.url ? "OK: checkout URL created" : "OK: demo access";
});

addCheck("Stripe trial checkout", async () => {
  const data = await postJson("/api/stripe-checkout", { plan: "trial" });
  if (!data.url && !data.demoAccess) throw new Error("Stripe checkout did not return a URL.");
  return data.url ? "OK: checkout URL created" : "OK: demo access";
});

console.log(`Tongue Test TCM launch check: ${baseUrl}`);
console.log("");

let failures = 0;
for (const check of checks) {
  try {
    const result = await check.run();
    console.log(`PASS  ${check.name} - ${result}`);
  } catch (error) {
    failures += 1;
    console.log(`WARN  ${check.name} - ${classifyFailure(error)}`);
  }
}

console.log("");
if (failures) {
  console.log(`${failures} check(s) need attention before launch.`);
  process.exitCode = 1;
} else {
  console.log("All launch checks passed.");
}
