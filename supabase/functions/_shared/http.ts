const DEFAULT_ALLOWED_ORIGINS = [
  "https://kiwiyolo.github.io",
  "https://qunluo-kiwi.com",
  "https://www.qunluo-kiwi.com",
  "http://localhost:4000",
  "http://localhost:3000",
  "http://127.0.0.1:4000",
  "http://127.0.0.1:3000",
];

function getAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS");
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = getAllowedOrigins();
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] ?? "*";
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-admin-secret",
    "access-control-max-age": "86400",
    "vary": "origin",
  };
}

export function okJson(req: Request, data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  Object.entries(corsHeaders(req)).forEach(([k, v]) => headers.set(k, v));
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function errJson(
  req: Request,
  status: number,
  message: string,
  code?: string,
): Response {
  return okJson(
    req,
    { ok: false, error: { message, code: code ?? "error" } },
    { status },
  );
}

export function okText(req: Request, text: string, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  Object.entries(corsHeaders(req)).forEach(([k, v]) => headers.set(k, v));
  headers.set("content-type", "text/plain; charset=utf-8");
  return new Response(text, { ...init, headers });
}

export async function readJson<T>(req: Request): Promise<T> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Expected application/json");
  }
  return (await req.json()) as T;
}

