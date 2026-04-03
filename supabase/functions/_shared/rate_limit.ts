import { getServiceClient } from "./supabase.ts";

type RateLimitConfig = {
  windowSeconds: number;
  max: number;
};

const DEFAULTS: Record<string, RateLimitConfig> = {
  subscribe: { windowSeconds: 3600, max: 3 },
  like_toggle: { windowSeconds: 3600, max: 120 },
  comment_create: { windowSeconds: 3600, max: 5 },
  admin: { windowSeconds: 3600, max: 2000 },
};

function windowEndsAt(now: Date, windowSeconds: number): Date {
  const t = now.getTime();
  const w = windowSeconds * 1000;
  return new Date(Math.floor(t / w) * w + w);
}

export async function rateLimitOrThrow(action: string, ipHash: string): Promise<void> {
  const cfg = DEFAULTS[action] ?? { windowSeconds: 3600, max: 60 };
  const supabase = getServiceClient();
  const now = new Date();
  const endsAt = windowEndsAt(now, cfg.windowSeconds);
  const key = `${action}:${ipHash}:${endsAt.toISOString()}`;

  const { data: existing, error: selErr } = await supabase
    .from("abuse_counters")
    .select("key,count,window_ends_at")
    .eq("key", key)
    .maybeSingle();
  if (selErr) throw selErr;

  if (!existing) {
    const { error: insErr } = await supabase.from("abuse_counters").insert({
      key,
      count: 1,
      window_ends_at: endsAt.toISOString(),
    });
    if (insErr) throw insErr;
    return;
  }

  const nextCount = (existing.count ?? 0) + 1;
  if (nextCount > cfg.max) {
    throw new Error("rate_limited");
  }

  const { error: updErr } = await supabase
    .from("abuse_counters")
    .update({ count: nextCount })
    .eq("key", key);
  if (updErr) throw updErr;
}

