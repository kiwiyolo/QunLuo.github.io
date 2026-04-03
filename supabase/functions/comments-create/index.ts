import { corsHeaders, errJson, okJson, readJson } from "../_shared/http.ts";
import { getClientIp, sha256Hex } from "../_shared/crypto.ts";
import { verifyTurnstile } from "../_shared/turnstile.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { normalizeCommentContent, normalizeNickname, normalizePostSlug } from "../_shared/validate.ts";
import { rateLimitOrThrow } from "../_shared/rate_limit.ts";

type CreateCommentRequest = {
  postSlug: string;
  nickname?: string;
  content: string;
  captchaToken: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return errJson(req, 405, "Method not allowed");

  let body: CreateCommentRequest;
  try {
    body = await readJson<CreateCommentRequest>(req);
  } catch {
    return errJson(req, 400, "Invalid JSON");
  }

  let postSlug: string;
  let nickname: string | null;
  let content: string;
  try {
    postSlug = normalizePostSlug(body.postSlug ?? "");
    nickname = normalizeNickname(body.nickname);
    content = normalizeCommentContent(body.content ?? "");
  } catch (e) {
    return errJson(req, 400, e instanceof Error ? e.message : "Invalid input");
  }

  const captchaToken = (body.captchaToken ?? "").trim();
  if (!captchaToken) return errJson(req, 400, "captchaToken is required");

  const ip = getClientIp(req);
  const salt = Deno.env.get("IP_HASH_SALT") ?? "";
  const ipHash = await sha256Hex(`${ip ?? "unknown"}:${salt}`);

  try {
    await rateLimitOrThrow("comment_create", ipHash);
  } catch (e) {
    if (e instanceof Error && e.message === "rate_limited") return errJson(req, 429, "Too many requests");
    return errJson(req, 500, "Rate limit error");
  }

  const v = await verifyTurnstile(captchaToken, ip);
  if (!v.success) return errJson(req, 400, "Captcha failed", "captcha_failed");

  const ua = req.headers.get("user-agent") ?? "";
  const uaHash = await sha256Hex(ua);

  const supabase = getServiceClient();
  const { data, error } = await supabase.from("comments").insert({
    post_slug: postSlug,
    nickname,
    content,
    status: "pending",
    ip_hash: ipHash,
    ua_hash: uaHash,
  }).select("id,post_slug,status,created_at").single();

  if (error) return errJson(req, 500, "Database error");

  return okJson(req, { ok: true, comment: data });
});

