import { corsHeaders, errJson, okJson } from "../_shared/http.ts";
import { getServiceClient } from "../_shared/supabase.ts";

type UserResponse = {
  email?: string;
};

async function getEmailFromAccessToken(accessToken: string): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
  if (!anonKey) throw new Error("Missing SUPABASE_ANON_KEY");

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as UserResponse;
  return data.email ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return errJson(req, 405, "Method not allowed");

  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return errJson(req, 401, "Missing access token");
  const accessToken = m[1].trim();
  if (!accessToken) return errJson(req, 401, "Missing access token");

  let email: string | null;
  try {
    email = await getEmailFromAccessToken(accessToken);
  } catch {
    return errJson(req, 500, "Auth error");
  }
  if (!email) return errJson(req, 401, "Invalid access token");

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("subscriptions")
    .upsert({ email, status: "active" }, { onConflict: "email" });
  if (error) return errJson(req, 500, "Database error");

  return okJson(req, { ok: true, email });
});

