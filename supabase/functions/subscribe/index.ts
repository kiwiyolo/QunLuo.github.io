import { corsHeaders, errJson, okJson, readJson } from "../_shared/http.ts";
import { getClientIp, sha256Hex } from "../_shared/crypto.ts";
import { verifyTurnstile } from "../_shared/turnstile.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { isEmail } from "../_shared/validate.ts";
import { rateLimitOrThrow } from "../_shared/rate_limit.ts";

type SubscribeRequest = { email: string; captchaToken: string };

async function sendMagicLink(email: string, redirectTo: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
  if (!anonKey) throw new Error("Missing SUPABASE_ANON_KEY");

  const res = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: anonKey,
    },
    body: JSON.stringify({
      email,
      create_user: true,
      options: { emailRedirectTo: redirectTo },
    }),
  });

  if (!res.ok) throw new Error("auth_otp_failed");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return errJson(req, 405, "Method not allowed");

  let body: SubscribeRequest;
  try {
    body = await readJson<SubscribeRequest>(req);
  } catch {
    return errJson(req, 400, "Invalid JSON");
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const captchaToken = (body.captchaToken ?? "").trim();

  if (!isEmail(email)) return errJson(req, 400, "Invalid email");
  if (!captchaToken) return errJson(req, 400, "captchaToken is required");

  const ip = getClientIp(req);
  const salt = Deno.env.get("IP_HASH_SALT") ?? "";
  const ipHash = await sha256Hex(`${ip ?? "unknown"}:${salt}`);

  try {
    await rateLimitOrThrow("subscribe", ipHash);
  } catch (e) {
    if (e instanceof Error && e.message === "rate_limited") return errJson(req, 429, "Too many requests");
    return errJson(req, 500, "Rate limit error");
  }

  const v = await verifyTurnstile(captchaToken, ip);
  if (!v.success) return errJson(req, 400, "Captcha failed", "captcha_failed");

  const supabase = getServiceClient();
  const { error } = await supabase.from("subscriptions").upsert(
    { email, status: "pending" },
    { onConflict: "email" },
  );
  if (error) return errJson(req, 500, "Database error");

  const siteUrl = Deno.env.get("SITE_URL") ?? "https://kiwiyolo.github.io/QunLuo.github.io";
  const redirectTo = `${siteUrl.replace(/\/$/, "")}/subscribe.html`;
  try {
    await sendMagicLink(email, redirectTo);
  } catch (e) {
    if (e instanceof Error && e.message === "auth_otp_failed") return errJson(req, 502, "Email delivery failed");
    return errJson(req, 500, "Email delivery failed");
  }

  return okJson(req, { ok: true, status: "pending_email_confirmation" });
});
