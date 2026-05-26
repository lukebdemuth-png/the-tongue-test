import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, randomUUID } from "node:crypto";

export type EmailPayload = {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
};

type GmailTokenSet = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope?: string;
  token_type?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultScopes = "https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send";

export function getOrCreateGmailSessionId(existing?: string) {
  return existing || randomUUID();
}

export function getGoogleOAuthUrl(input: { sessionId: string; returnTo?: string }) {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const redirectUri = requiredEnv("GOOGLE_REDIRECT_URI");
  const scopes = process.env.GMAIL_SCOPES || defaultScopes;
  const state = signOAuthState({
    sessionId: input.sessionId,
    nonce: randomBytes(16).toString("hex"),
    returnTo: input.returnTo || "/",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, state };
}

export async function handleGoogleOAuthCallback(code: string, state: string) {
  const statePayload = verifyOAuthState(state);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: requiredEnv("GOOGLE_CLIENT_ID"),
      client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: requiredEnv("GOOGLE_REDIRECT_URI"),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error("Google OAuth token exchange failed.");
  }

  const body = await response.json();
  if (typeof body.access_token !== "string") {
    throw new Error("Google OAuth did not return an access token.");
  }

  const existing = await readStoredToken(statePayload.sessionId);
  const tokenSet: GmailTokenSet = {
    access_token: body.access_token,
    refresh_token: typeof body.refresh_token === "string" ? body.refresh_token : existing?.refresh_token,
    expires_at: Date.now() + Number(body.expires_in ?? 3600) * 1000,
    scope: typeof body.scope === "string" ? body.scope : undefined,
    token_type: typeof body.token_type === "string" ? body.token_type : undefined,
  };

  if (!tokenSet.refresh_token) {
    throw new Error("Google OAuth did not return a refresh token. Reconnect Gmail and approve offline access.");
  }

  await writeStoredToken(statePayload.sessionId, tokenSet);
  await logGmailEvent("gmail_connected");
  return statePayload;
}

export async function refreshGoogleAccessToken(sessionId: string) {
  const tokenSet = await readStoredToken(sessionId);
  if (!tokenSet?.refresh_token) {
    throw new Error("Gmail is not connected.");
  }
  if (tokenSet.access_token && tokenSet.expires_at > Date.now() + 60_000) {
    return tokenSet.access_token;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requiredEnv("GOOGLE_CLIENT_ID"),
      client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
      refresh_token: tokenSet.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Could not refresh Gmail access.");
  }

  const body = await response.json();
  const updated: GmailTokenSet = {
    ...tokenSet,
    access_token: body.access_token,
    expires_at: Date.now() + Number(body.expires_in ?? 3600) * 1000,
    scope: typeof body.scope === "string" ? body.scope : tokenSet.scope,
    token_type: typeof body.token_type === "string" ? body.token_type : tokenSet.token_type,
  };

  await writeStoredToken(sessionId, updated);
  return updated.access_token;
}

export async function createGmailDraft(sessionId: string, payload: EmailPayload) {
  validateEmailPayload(payload);
  const accessToken = await refreshGoogleAccessToken(sessionId);
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: { raw: buildBase64UrlMimeMessage(payload) } }),
  });

  if (!response.ok) {
    throw new Error("Could not create Gmail draft.");
  }

  const body = await response.json();
  await logGmailEvent("draft_created");
  return { id: body.id as string | undefined };
}

export async function sendGmailMessage(sessionId: string, payload: EmailPayload) {
  validateEmailPayload(payload);
  const accessToken = await refreshGoogleAccessToken(sessionId);
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: buildBase64UrlMimeMessage(payload) }),
  });

  if (!response.ok) {
    throw new Error("Could not send Gmail message.");
  }

  const body = await response.json();
  await logGmailEvent("email_sent");
  return { id: body.id as string | undefined };
}

export async function revokeGmailAccess(sessionId: string) {
  const tokenSet = await readStoredToken(sessionId);
  if (tokenSet?.refresh_token) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenSet.refresh_token)}`, {
      method: "POST",
    });
  }
  await deleteStoredToken(sessionId);
  await logGmailEvent("gmail_disconnected");
}

export async function hasGmailConnection(sessionId?: string) {
  if (!sessionId) return false;
  return Boolean(await readStoredToken(sessionId));
}

export function validateEmailPayload(payload: EmailPayload) {
  validateEmailList(payload.to, "to", true);
  validateEmailList(payload.cc, "cc", false);
  validateEmailList(payload.bcc, "bcc", false);
  if (!payload.subject?.trim()) throw new Error("Email subject is required.");
  if (!payload.body?.trim()) throw new Error("Email body is required.");
}

export function buildBase64UrlMimeMessage(payload: EmailPayload) {
  validateEmailPayload(payload);
  const lines = [
    `To: ${payload.to}`,
    payload.cc ? `Cc: ${payload.cc}` : "",
    payload.bcc ? `Bcc: ${payload.bcc}` : "",
    `Subject: ${payload.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    payload.body,
  ].filter(Boolean);

  return Buffer.from(lines.join("\r\n"), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function validateEmailList(value: string | undefined, label: string, required: boolean) {
  if (!value?.trim()) {
    if (required) throw new Error(`Email ${label} is required.`);
    return;
  }

  const emails = value.split(",").map((item) => item.trim()).filter(Boolean);
  if (!emails.length && required) throw new Error(`Email ${label} is required.`);
  if (emails.some((email) => !emailPattern.test(email))) {
    throw new Error(`Email ${label} contains an invalid address.`);
  }
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for Gmail integration.`);
  return value;
}

function stateSecret() {
  return process.env.GMAIL_STATE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "local-gmail-state-secret";
}

function signOAuthState(payload: { sessionId: string; nonce: string; returnTo: string }) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", stateSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

function verifyOAuthState(state: string) {
  const [encoded, sig] = state.split(".");
  if (!encoded || !sig) throw new Error("Invalid Gmail OAuth state.");
  const expected = createHmac("sha256", stateSecret()).update(encoded).digest("base64url");
  if (sig !== expected) throw new Error("Invalid Gmail OAuth state signature.");
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
    sessionId: string;
    nonce: string;
    returnTo: string;
  };
  if (!payload.sessionId) throw new Error("Invalid Gmail OAuth session.");
  return payload;
}

async function readStoredToken(sessionId: string): Promise<GmailTokenSet | null> {
  return readSupabaseToken(sessionId);
}

async function writeStoredToken(sessionId: string, tokenSet: GmailTokenSet) {
  const wroteToSupabase = await writeSupabaseToken(sessionId, tokenSet);
  if (!wroteToSupabase) {
    throw new Error("Supabase token storage is required before connecting Gmail.");
  }
}

async function deleteStoredToken(sessionId: string) {
  await deleteSupabaseToken(sessionId);
}

function encryptionKey() {
  const source = process.env.GMAIL_TOKEN_ENCRYPTION_KEY || process.env.GOOGLE_CLIENT_SECRET;
  if (!source) throw new Error("GMAIL_TOKEN_ENCRYPTION_KEY is required for Gmail token storage.");
  return createHash("sha256").update(source).digest();
}

function encryptJson(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptJson<T>(value: string): T {
  const [iv, tag, encrypted] = value.split(".");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}

async function readSupabaseToken(sessionId: string) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_GMAIL_TOKENS_TABLE || "gmail_oauth_tokens";
  if (!url || !serviceRoleKey) return null;

  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/${table}?session_id=eq.${encodeURIComponent(sessionId)}&select=encrypted_token_json&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );
  if (!response.ok) throw new Error("Could not read Gmail token store.");
  const rows = (await response.json()) as Array<{ encrypted_token_json?: string }>;
  return rows[0]?.encrypted_token_json ? decryptJson<GmailTokenSet>(rows[0].encrypted_token_json) : null;
}

async function writeSupabaseToken(sessionId: string, tokenSet: GmailTokenSet) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_GMAIL_TOKENS_TABLE || "gmail_oauth_tokens";
  if (!url || !serviceRoleKey) return false;

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}?on_conflict=session_id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      session_id: sessionId,
      encrypted_token_json: encryptJson(tokenSet),
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) throw new Error("Could not write Gmail token store.");
  return true;
}

async function deleteSupabaseToken(sessionId: string) {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_GMAIL_TOKENS_TABLE || "gmail_oauth_tokens";
  if (!url || !serviceRoleKey) return false;

  await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}?session_id=eq.${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  return true;
}

async function logGmailEvent(event: "gmail_connected" | "draft_created" | "email_sent" | "gmail_disconnected") {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_GMAIL_EVENTS_TABLE || "gmail_events";
  if (!url || !serviceRoleKey) return;

  await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      event,
      created_at: new Date().toISOString(),
    }),
  });
}
