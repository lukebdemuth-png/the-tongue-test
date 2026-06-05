export function createSupabaseRestHeaders(key: string, prefer?: string) {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
  };

  // Newer Supabase secret keys are not JWTs. They should be sent as `apikey`,
  // while legacy service_role JWTs may also be sent as a bearer token.
  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }

  if (prefer) headers.Prefer = prefer;

  return headers;
}
