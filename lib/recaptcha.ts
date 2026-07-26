/**
 * reCAPTCHA v3 verification.
 *
 * IMPORTANT — this fixes a real, long-standing hole rather than porting one.
 *
 * includes/utility.php did:
 *     return $response['success'];
 *
 * For reCAPTCHA **v3**, `success: true` means only "this token is
 * well-formed, unexpired, and matches the site key". It says nothing about
 * whether the visitor looked human — that is what `score` is for. So the
 * contact form has had no effective bot protection for as long as reCAPTCHA has
 * been on it, and the earlier migration attempt reproduced the bug verbatim.
 *
 * A correct v3 check needs all three: success, a score above threshold, and a
 * matching action name (so a token minted on some other page can't be replayed).
 */
const DEFAULT_THRESHOLD = 0.5;

export type CaptchaResult = {
  ok: boolean;
  /** Present when Google returned a score. */
  score?: number;
  reason?: string;
};

export function captchaConfigured(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY);
}

export async function verifyCaptcha(
  token: string | undefined | null,
  expectedAction: string,
): Promise<CaptchaResult> {
  if (!captchaConfigured()) {
    // Unconfigured (local dev): allow through rather than blocking every
    // submission, but say so loudly.
    console.warn("[recaptcha] RECAPTCHA_SECRET_KEY not set; skipping check");
    return { ok: true, reason: "not-configured" };
  }
  if (!token) return { ok: false, reason: "missing-token" };

  const threshold = Number(
    process.env.RECAPTCHA_MIN_SCORE ?? DEFAULT_THRESHOLD,
  );

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY!,
        response: token,
      }),
    });
    const data = (await res.json()) as {
      success?: boolean;
      score?: number;
      action?: string;
      "error-codes"?: string[];
    };

    if (!data.success) {
      // Logged explicitly so a misconfigured key is distinguishable from a bot.
      console.warn("[recaptcha] verify failed:", data["error-codes"]);
      return { ok: false, reason: "verify-failed" };
    }
    if (data.action && data.action !== expectedAction) {
      return { ok: false, score: data.score, reason: "action-mismatch" };
    }
    if (typeof data.score === "number" && data.score < threshold) {
      return { ok: false, score: data.score, reason: "low-score" };
    }
    return { ok: true, score: data.score };
  } catch (err) {
    console.error("[recaptcha] request threw:", err);
    // Fail OPEN on a network error: Google being unreachable should not stop a
    // real customer from booking. The honeypot and zod validation still apply.
    return { ok: true, reason: "network-error" };
  }
}
