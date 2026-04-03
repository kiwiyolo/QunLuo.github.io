import { corsHeaders, errJson, okText } from "../_shared/http.ts";
import { getClientIp, sha256Hex } from "../_shared/crypto.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { rateLimitOrThrow } from "../_shared/rate_limit.ts";

function requireAdmin(req: Request): string | null {
  const secret = Deno.env.get("ADMIN_SECRET");
  if (!secret) return "Missing ADMIN_SECRET";
  const provided = req.headers.get("x-admin-secret") ?? "";
  if (!provided || provided !== secret) return "Unauthorized";
  return null;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "GET") return errJson(req, 405, "Method not allowed");

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

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("email,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100000);
  if (error) return errJson(req, 500, "Database error");

  const rows = data ?? [];
  const header = ["email", "status", "created_at"].join(",");
  const lines = rows.map((r) =>
    [r.email ?? "", r.status ?? "", r.created_at ?? ""].map((v) => csvEscape(String(v))).join(",")
  );
  const csv = [header, ...lines].join("\n");

  return okText(req, csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=subscriptions.csv",
    },
  });
});

