type TurnstileVerifyResult = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstile(
  token: string,
  remoteIp?: string | null,
): Promise<TurnstileVerifyResult> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    throw new Error("Missing TURNSTILE_SECRET_KEY");
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!res.ok) {
    return { success: false, "error-codes": ["turnstile_http_error"] };
  }

  return (await res.json()) as TurnstileVerifyResult;
}

