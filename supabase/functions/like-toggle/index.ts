import { corsHeaders, errJson, okJson, readJson } from "../_shared/http.ts";
import { getClientIp, sha256Hex } from "../_shared/crypto.ts";
import { verifyTurnstile } from "../_shared/turnstile.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { normalizeDeviceId, normalizePostSlug } from "../_shared/validate.ts";
import { rateLimitOrThrow } from "../_shared/rate_limit.ts";

type ToggleLikeRequest = { postSlug: string; deviceId: string; captchaToken: string; liked?: boolean };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method === "GET") {
    const query = new URL(req.url).searchParams;
    let postSlug: string;
    let deviceId: string;
    try {
      postSlug = normalizePostSlug(query.get("postSlug") ?? "");
      deviceId = normalizeDeviceId(query.get("deviceId") ?? "");
    } catch { return errJson(req, 400, "Invalid input"); }
    try {
      const client = getServiceClient();
      const [total, own] = await Promise.all([
        client.from("post_likes").select("id", { count: "exact", head: true }).eq("post_slug", postSlug).eq("liked", true),
        client.from("post_likes").select("liked").eq("post_slug", postSlug).eq("device_id", deviceId).maybeSingle(),
      ]);
      if (total.error || own.error) return errJson(req, 500, "Unable to load likes");
      return okJson(req, { ok: true, count: total.count ?? 0, liked: own.data?.liked ?? false }, { headers: { "cache-control": "no-store" } });
    } catch { return errJson(req, 500, "Unable to load likes"); }
  }
  if (req.method !== "POST") return errJson(req, 405, "Method not allowed");

  let body: ToggleLikeRequest;
  try {
    body = await readJson<ToggleLikeRequest>(req);
  } catch {
    return errJson(req, 400, "Invalid JSON");
  }

  let postSlug: string;
  let deviceId: string;
  try {
    postSlug = normalizePostSlug(body.postSlug ?? "");
    deviceId = normalizeDeviceId(body.deviceId ?? "");
  } catch (e) {
    return errJson(req, 400, e instanceof Error ? e.message : "Invalid input");
  }

  const captchaToken = (body.captchaToken ?? "").trim();
  if (!captchaToken) return errJson(req, 400, "captchaToken is required");

  const ip = getClientIp(req);
  const salt = Deno.env.get("IP_HASH_SALT") ?? "";
  const ipHash = await sha256Hex(`${ip ?? "unknown"}:${salt}`);

  try {
    await rateLimitOrThrow("like_toggle", ipHash);
  } catch (e) {
    if (e instanceof Error && e.message === "rate_limited") return errJson(req, 429, "Too many requests");
    return errJson(req, 500, "Rate limit error");
  }

  const v = await verifyTurnstile(captchaToken, ip);
  if (!v.success) return errJson(req, 400, "Captcha failed", "captcha_failed");

  const supabase = getServiceClient();

  const { data: existing, error: selErr } = await supabase
    .from("post_likes")
    .select("id,liked")
    .eq("post_slug", postSlug)
    .eq("device_id", deviceId)
    .maybeSingle();
  if (selErr) return errJson(req, 500, "Database error");

  const nextLiked = typeof body.liked === "boolean" ? body.liked : (existing ? !existing.liked : true);

  if (!existing) {
    const { error: insErr } = await supabase.from("post_likes").insert({
      post_slug: postSlug,
      device_id: deviceId,
      liked: nextLiked,
    });
    if (insErr) return errJson(req, 500, "Database error");
  } else {
    const { error: updErr } = await supabase
      .from("post_likes")
      .update({ liked: nextLiked, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (updErr) return errJson(req, 500, "Database error");
  }

  const { count, error: cntErr } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_slug", postSlug)
    .eq("liked", true);
  if (cntErr) return errJson(req, 500, "Database error");

  return okJson(req, { ok: true, liked: nextLiked, count: count ?? 0 });
});

