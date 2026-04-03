import { corsHeaders, errJson, okJson, readJson } from "../_shared/http.ts";
import { getClientIp, sha256Hex } from "../_shared/crypto.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { rateLimitOrThrow } from "../_shared/rate_limit.ts";

type AdminModerateCommentRequest = {
  commentId: string;
  action: "approve" | "reject" | "delete";
};

function requireAdmin(req: Request): string | null {
  const secret = Deno.env.get("ADMIN_SECRET");
  if (!secret) return "Missing ADMIN_SECRET";
  const provided = req.headers.get("x-admin-secret") ?? "";
  if (!provided || provided !== secret) return "Unauthorized";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return errJson(req, 405, "Method not allowed");

  const authErr = requireAdmin(req);
  if (authErr) return errJson(req, 401, authErr);

  const ip = getClientIp(req);
  const salt = Deno.env.get("IP_HASH_SALT") ?? "";
  const ipHash = await sha256Hex(`${ip ?? "unknown"}:${salt}`);
  try {
    await rateLimitOrThrow("admin", ipHash);
  } catch (e) {
    if (e instanceof Error && e.message === "rate_limited") return errJson(req, 429, "Too many requests");
    return errJson(req, 500, "Rate limit error");
  }

  let body: AdminModerateCommentRequest;
  try {
    body = await readJson<AdminModerateCommentRequest>(req);
  } catch {
    return errJson(req, 400, "Invalid JSON");
  }

  const commentId = (body.commentId ?? "").trim();
  const action = body.action;
  if (!commentId) return errJson(req, 400, "commentId is required");
  if (!action) return errJson(req, 400, "action is required");

  const supabase = getServiceClient();

  if (action === "delete") {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) return errJson(req, 500, "Database error");
    return okJson(req, { ok: true });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const { error } = await supabase.from("comments").update({ status }).eq("id", commentId);
  if (error) return errJson(req, 500, "Database error");
  return okJson(req, { ok: true });
});

