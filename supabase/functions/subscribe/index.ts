import { corsHeaders, errJson, okJson, readJson } from "../_shared/http.ts";
import { base64UrlEncodeText, getClientIp, hmacSha256Base64Url, sha256Hex } from "../_shared/crypto.ts";
import { verifyTurnstile } from "../_shared/turnstile.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { isEmail } from "../_shared/validate.ts";
import { rateLimitOrThrow } from "../_shared/rate_limit.ts";

type SubscribeRequest = { email: string; captchaToken: string; locale?: string };

function getSiteUrl(): string {
  const raw = (Deno.env.get("SITE_URL") ?? "").trim();
  const withDefault = raw || "https://qunluo-kiwi.com";
  const normalized = /^https?:\/\//i.test(withDefault) ? withDefault : `https://${withDefault}`;
  return normalized.replace(/\/$/, "");
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

async function sendConfirmEmailWithResend(email: string, token: string, chinese: boolean): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");

  const from = Deno.env.get("RESEND_FROM") ?? "kiwi <noreply@qunluo-kiwi.com>";
  const siteUrl = getSiteUrl();
  const confirmUrl = `${siteUrl}/${chinese ? "zh/" : ""}subscribe.html#confirm=${encodeURIComponent(token)}`;

  const html = chinese
    ? `<p>感谢订阅罗群的个人主页。</p><p>请点击以下链接确认订阅：</p><p><a href="${confirmUrl}">确认订阅</a></p><p>如未申请订阅，请忽略此邮件。链接在 24 小时内有效。</p>`
    :
    `<p>Thanks for subscribing.</p>` +
    `<p>Please confirm your subscription by clicking the button below:</p>` +
    `<p><a href="${confirmUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#111827;color:#ffffff;text-decoration:none;font-weight:600;">Confirm subscription</a></p>` +
    `<p style="margin-top:18px;">If the button does not work, copy and paste this URL into your browser:</p>` +
    `<p><a href="${confirmUrl}">${confirmUrl}</a></p>` +
    `<p>If you did not request this, you can ignore this email.</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: chinese ? "确认订阅 · 罗群" : "Confirm your subscription · LUO Qun",
      html,
      text: chinese ? `感谢订阅。请在24小时内确认订阅：\n${confirmUrl}\n如未申请订阅，请忽略此邮件。` : `Thanks for subscribing.\n\nConfirm your subscription:\n${confirmUrl}\n\nIf you did not request this, you can ignore this email.`,
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
  const current = await supabase.from("subscriptions").select("status").eq("email", email).maybeSingle();
  if (current.error) return errJson(req, 500, "Database error");

  try {
    const token = await createConfirmToken(email);
    await sendConfirmEmailWithResend(email, token, body.locale === "zh-CN");
  } catch (e) {
    return errJson(req, 502, "Email delivery failed");
  }

  // Retrying a subscription must never deactivate an already confirmed reader.
  if (current.data?.status !== "active") {
    const result = current.data
      ? await supabase.from("subscriptions").update({ status: "pending" }).eq("email", email).neq("status", "active")
      : await supabase.from("subscriptions").upsert(
        { email, status: "pending" }, { onConflict: "email", ignoreDuplicates: true },
      );
    const { error } = result;
    if (error) return errJson(req, 500, "Database error");
  }

  return okJson(req, { ok: true, status: "pending_email_confirmation" });
});
