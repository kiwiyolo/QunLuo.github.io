import { corsHeaders, errJson, okJson, readJson } from "../_shared/http.ts";
import { base64UrlDecodeText, hmacSha256Base64Url } from "../_shared/crypto.ts";
import { getServiceClient } from "../_shared/supabase.ts";

type ConfirmRequest = { token: string };

function getSubscribeSigningKey(): string {
  const key = Deno.env.get("SUBSCRIBE_SIGNING_KEY") ?? Deno.env.get("ADMIN_SECRET");
  if (!key) throw new Error("Missing SUBSCRIBE_SIGNING_KEY");
  return key;
}

async function verifyToken(token: string): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [emailB64, issuedAtRaw, sig] = parts;
  if (!emailB64 || !issuedAtRaw || !sig) return null;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return null;

  const now = Math.floor(Date.now() / 1000);
  const maxAgeSeconds = Number(Deno.env.get("SUBSCRIBE_TOKEN_MAX_AGE_SECONDS") ?? "86400");
  if (now - issuedAt > maxAgeSeconds) return null;
  if (issuedAt > now + 300) return null;

  const payload = `${emailB64}.${issuedAtRaw}`;
  const expected = await hmacSha256Base64Url(payload, getSubscribeSigningKey());
  if (expected !== sig) return null;

  const email = base64UrlDecodeText(emailB64).trim().toLowerCase();
  if (!email || !email.includes("@")) return null;
  return email;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return errJson(req, 405, "Method not allowed");

  let body: ConfirmRequest;
  try {
    body = await readJson<ConfirmRequest>(req);
  } catch {
    return errJson(req, 400, "Invalid JSON");
  }

  const token = (body.token ?? "").trim();
  if (!token) return errJson(req, 400, "token is required");

  let email: string | null = null;
  try {
    email = await verifyToken(token);
  } catch {
    return errJson(req, 500, "Token verify error");
  }
  if (!email) return errJson(req, 401, "Invalid or expired token");

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("subscriptions")
    .upsert({ email, status: "active" }, { onConflict: "email" });
  if (error) return errJson(req, 500, "Database error");

  return okJson(req, { ok: true, email });
});
