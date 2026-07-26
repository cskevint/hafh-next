/**
 * Shared-password gate for /admin.
 *
 * Replaces the PHP's IP allowlist, which compared REMOTE_ADDR against a
 * hardcoded residential IP and — because admin/leads.php had no `exit()` after
 * its `header('Location: /404.php')` — RENDERED THE LEAD LIST ANYWAY to anyone
 * whose IP didn't match. An allowlist also breaks whenever the ISP rotates.
 *
 * Checked in BOTH proxy.ts and the page itself. Proxy matchers are easy to get
 * subtly wrong and the failure mode here is publishing a customer list, so the
 * page does not trust that the proxy ran.
 */
const REALM = 'Basic realm="HAFH Admin", charset="UTF-8"';

export function adminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Constant-time string compare, so response timing can't be used to guess the
 * password a character at a time. Avoids node:crypto so this stays usable in
 * the edge runtime. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Always compare a fixed number of bytes so length doesn't leak via timing.
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Validates an Authorization header against ADMIN_PASSWORD.
 * Any username is accepted; only the password is checked.
 */
export function isAuthorized(authHeader: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  // Fail CLOSED when unconfigured: an admin page with no password set must not
  // be world-readable. This is the opposite of the lead-capture integrations,
  // which no-op when unconfigured.
  if (!expected) return false;
  if (!authHeader?.startsWith("Basic ")) return false;

  try {
    const decoded = atob(authHeader.slice("Basic ".length).trim());
    const password = decoded.slice(decoded.indexOf(":") + 1);
    return timingSafeEqual(password, expected);
  } catch {
    return false;
  }
}

export function unauthorizedResponse(): Response {
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": REALM,
      "Cache-Control": "no-store",
    },
  });
}
