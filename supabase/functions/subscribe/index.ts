import { corsHeaders, errJson, okJson, readJson } from "../_shared/http.ts";
import { base64UrlEncodeText, getClientIp, hmacSha256Base64Url, sha256Hex } from "../_shared/crypto.ts";
import { verifyTurnstile } from "../_shared/turnstile.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { isEmail } from "../_shared/validate.ts";
import { rateLimitOrThrow } from "../_shared/rate_limit.ts";

type SubscribeRequest = { email: string; captchaToken: string };

function getSiteUrl(): string {
  return (Deno.env.get("SITE_URL") ?? "https://qunluo-kiwi.com").replace(/\/$/, "");
}

function getSubscribeSigningKey(): string {
  const key = Deno.env.get("SUBSCRIBE_SIGNING_KEY") ?? Deno.env.get("ADMIN_SECRET");
  if (!key) throw new Error("Missing SUBSCRIBE_SIGNING_KEY");
  return key;
}

async function createConfirmToken(email: string): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const emailB64 = base64UrlEncodeText(email);
  const payload = `${emailB64}.${issuedAt}`;
  const sig = await hmacSha256Base64Url(payload, getSubscribeSigningKey());
  return `${payload}.${sig}`;
}

async function sendConfirmEmailWithResend(email: string, token: string): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");

  const from = Deno.env.get("RESEND_FROM") ?? "noreply@qunluo-kiwi.com";
  const siteUrl = getSiteUrl();
  const confirmUrl = `${siteUrl}/subscribe.html#confirm=${encodeURIComponent(token)}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Confirm your subscription",
      html:
        `<p>Thanks for subscribing.</p>` +
        `<p>Please confirm your subscription by clicking the link below:</p>` +
        `<p><a href="${confirmUrl}">Confirm subscription</a></p>` +
        `<p>If you did not request this, you can ignore this email.</p>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "resend_failed");
  }
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

  try {
    const token = await createConfirmToken(email);
    await sendConfirmEmailWithResend(email, token);
  } catch (e) {
    return errJson(req, 502, "Email delivery failed");
  }

  return okJson(req, { ok: true, status: "pending_email_confirmation" });
});
