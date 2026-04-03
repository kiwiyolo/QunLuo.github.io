import { corsHeaders, errJson, okJson, readJson } from "../_shared/http.ts";
import { getClientIp, sha256Hex } from "../_shared/crypto.ts";
import { verifyTurnstile } from "../_shared/turnstile.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { isEmail } from "../_shared/validate.ts";
import { rateLimitOrThrow } from "../_shared/rate_limit.ts";

type SubscribeRequest = { email: string; captchaToken: string };

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
    { email, status: "active" },
    { onConflict: "email" },
  );
  if (error) return errJson(req, 500, "Database error");

  return okJson(req, { ok: true });
});

