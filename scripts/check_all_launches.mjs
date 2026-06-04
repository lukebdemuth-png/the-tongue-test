#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = "/Users/creative";
const tongueDir = path.join(root, "Documents/New project");
const homeopathyDir = path.join(root, "YourMasterHomeopathy");
const innateDir = path.join(root, "innate-wellness");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
    status: result.status,
  };
}

function envStatus(filePath, key) {
  if (!existsSync(filePath)) return "missing-file";
  const line = readFileSync(filePath, "utf8")
    .split(/\n/)
    .find((entry) => entry.startsWith(`${key}=`));
  if (!line) return "missing";
  const value = line.slice(key.length + 1).trim();
  if (!value) return "blank";
  if (/your_|placeholder|your-/i.test(value)) return "placeholder";
  return "present";
}

async function fetchStatus(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return { ok: response.ok, status: response.status, text: await response.text().catch(() => "") };
  } catch (error) {
    return { ok: false, status: 0, text: error instanceof Error ? error.message : String(error) };
  }
}

function curlHeadStatus(url, cwd) {
  const result = run("curl", ["-I", "-s", url], cwd);
  if (!result.ok) return { ok: false, status: 0, detail: result.stderr || result.stdout };
  const firstLine = result.stdout.split(/\n/).find(Boolean) || "";
  const status = Number(firstLine.match(/\s(\d{3})\s/)?.[1] || 0);
  return { ok: status >= 200 && status < 400, status, detail: firstLine };
}

function print(status, label, detail = "") {
  const marker = status === "pass" ? "PASS" : status === "warn" ? "WARN" : "FAIL";
  console.log(`${marker}  ${label}${detail ? ` - ${detail}` : ""}`);
}

console.log("Launch readiness sweep: Tongue Test TCM + Your Master Homeopathy");
console.log("");

const tongueGit = run("git", ["status", "--short", "--branch"], tongueDir);
print(tongueGit.ok && /main\.\.\.tongue\/main/.test(tongueGit.stdout) ? "pass" : "warn", "Tongue repo", tongueGit.stdout || tongueGit.stderr);

const tongueBuild = run("npm", ["run", "build"], tongueDir);
print(tongueBuild.ok ? "pass" : "fail", "Tongue production build", tongueBuild.ok ? "build passed" : tongueBuild.stderr || tongueBuild.stdout);

const tongueLaunch = run("npm", ["run", "launch:check"], tongueDir);
print(tongueLaunch.ok ? "pass" : "warn", "Tongue live launch check", tongueLaunch.ok ? "all checks passed" : "some checks blocked; run npm run launch:check for details");

const tonguePage = curlHeadStatus("https://the-tongue-test.vercel.app/tongue-assessment", tongueDir);
print(tonguePage.ok ? "pass" : "fail", "Tongue landing/app page", String(tonguePage.status || tonguePage.detail));

console.log("");

const homeopathyGit = run("git", ["status", "--short", "--branch"], homeopathyDir);
print(homeopathyGit.ok ? "pass" : "warn", "Homeopathy repo state", homeopathyGit.stdout || homeopathyGit.stderr);

const expoDoctor = run("npx", ["expo-doctor"], homeopathyDir);
print(expoDoctor.ok ? "pass" : "fail", "Homeopathy Expo doctor", expoDoctor.ok ? "18/18 checks pass" : expoDoctor.stderr || expoDoctor.stdout);

const easWhoami = run("npx", ["eas-cli", "whoami"], homeopathyDir);
print(easWhoami.ok ? "pass" : "warn", "EAS login", easWhoami.ok ? easWhoami.stdout : "not logged in");

const homeEnv = path.join(homeopathyDir, ".env");
print(envStatus(homeEnv, "EXPO_PUBLIC_REVENUECAT_IOS_KEY") === "present" ? "pass" : "warn", "RevenueCat iOS key", envStatus(homeEnv, "EXPO_PUBLIC_REVENUECAT_IOS_KEY"));
print(envStatus(homeEnv, "EXPO_PUBLIC_REVENUECAT_ANDROID_KEY") === "present" ? "pass" : "warn", "RevenueCat Android key", envStatus(homeEnv, "EXPO_PUBLIC_REVENUECAT_ANDROID_KEY"));

const appJson = JSON.parse(readFileSync(path.join(homeopathyDir, "app.json"), "utf8"));
const easProjectId = appJson?.expo?.extra?.eas?.projectId;
print(easProjectId && !/your-/i.test(easProjectId) ? "pass" : "warn", "EAS project id", easProjectId || "missing");

const homePage = curlHeadStatus("https://yourmasterhomeopathy.com", homeopathyDir);
print(homePage.ok ? "pass" : "warn", "Homeopathy public domain", homePage.ok ? String(homePage.status) : "custom DNS should be verified in Vercel/Namecheap");

const innateBuild = run("npm", ["run", "build"], innateDir);
print(innateBuild.ok ? "pass" : "fail", "Innate backend build", innateBuild.ok ? "build passed" : innateBuild.stderr || innateBuild.stdout);

const aiGuide = await fetchStatus("https://innate-wellness.vercel.app/api/ai-guide", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ messages: [{ role: "user", content: "Launch check." }] }),
});
if (aiGuide.ok) {
  print("pass", "Homeopathy AI guide endpoint", "responded");
} else if (/not configured/i.test(aiGuide.text)) {
  print("warn", "Homeopathy AI guide endpoint", "blocked by missing ANTHROPIC_API_KEY");
} else {
  print("fail", "Homeopathy AI guide endpoint", `${aiGuide.status} ${aiGuide.text.slice(0, 120)}`);
}

console.log("");
console.log("Key links if blocked:");
console.log("- Supabase service role key: https://supabase.com/dashboard/project/irnvzkkzujcebusrlphs/settings/api");
console.log("- Tongue Vercel envs: https://vercel.com/3-patterns/the-tongue-test/settings/environment-variables");
console.log("- Stripe API keys: https://dashboard.stripe.com/apikeys");
console.log("- Stripe webhooks: https://dashboard.stripe.com/webhooks");
console.log("- Anthropic API keys: https://console.anthropic.com/settings/keys");
console.log("- Innate Wellness Vercel envs: https://vercel.com/3-patterns/innate-wellness/settings/environment-variables");
console.log("- RevenueCat projects: https://app.revenuecat.com/");
console.log("- Expo/EAS login: https://expo.dev/");
