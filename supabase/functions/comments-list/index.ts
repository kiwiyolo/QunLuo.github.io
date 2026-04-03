import { corsHeaders, errJson, okJson } from "../_shared/http.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { normalizePostSlug } from "../_shared/validate.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "GET") return errJson(req, 405, "Method not allowed");

  const url = new URL(req.url);
  const raw = url.searchParams.get("postSlug") ?? "";

  let postSlug: string;
  try {
    postSlug = normalizePostSlug(raw);
  } catch (e) {
    return errJson(req, 400, e instanceof Error ? e.message : "Invalid postSlug");
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id,post_slug,nickname,content,created_at")
    .eq("post_slug", postSlug)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return errJson(req, 500, "Database error");
  return okJson(req, { ok: true, comments: data ?? [] });
});

