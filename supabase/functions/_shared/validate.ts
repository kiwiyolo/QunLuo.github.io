export function isEmail(email: string): boolean {
  if (email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizePostSlug(slug: string): string {
  const s = slug.trim();
  if (!s) throw new Error("postSlug is required");
  if (s.length > 200) throw new Error("postSlug too long");
  if (!/^[a-zA-Z0-9/_\-\.]+$/.test(s)) throw new Error("postSlug contains invalid characters");
  return s;
}

export function normalizeDeviceId(deviceId: string): string {
  const s = deviceId.trim();
  if (!s) throw new Error("deviceId is required");
  if (s.length > 128) throw new Error("deviceId too long");
  if (!/^[a-zA-Z0-9_\-]+$/.test(s)) throw new Error("deviceId contains invalid characters");
  return s;
}

export function normalizeNickname(nickname?: string): string | null {
  if (nickname == null) return null;
  const s = nickname.trim();
  if (!s) return null;
  if (s.length > 50) throw new Error("nickname too long");
  return s;
}

export function normalizeCommentContent(content: string): string {
  const s = content.trim();
  if (!s) throw new Error("content is required");
  if (s.length > 2000) throw new Error("content too long");
  const links = (s.match(/https?:\/\//gi) ?? []).length;
  if (links > 2) throw new Error("too many links");
  return s;
}

