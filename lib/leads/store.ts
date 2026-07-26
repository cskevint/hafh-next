import { put } from "@vercel/blob";

export type LeadKind = "newsletter" | "ebook" | "guide" | "quiz" | "contact";

export type LeadRecord = {
  kind: LeadKind;
  receivedAt: string;
  email: string;
  name?: string;
  /** Everything else the form collected, kind-specific. */
  fields?: Record<string, string | boolean | null>;
  meta?: { ip?: string; userAgent?: string; referer?: string };
};

/**
 * Lead persistence: ONE PRIVATE BLOB PER SUBMISSION.
 *
 * The earlier migration attempt kept a single aggregate JSON array per lead
 * type and had four separate defects, all of which this shape avoids:
 *
 *  1. `access: 'public'` with `addRandomSuffix: false` made the URL
 *     deterministic, so the entire subscriber list was anonymously
 *     enumerable at a guessable address.
 *  2. `put()` with `addRandomSuffix: false` throws on an existing pathname
 *     unless `allowOverwrite` is set — so the SECOND signup ever would have
 *     thrown. It went unnoticed because the caller only console.error'd while
 *     still telling the user "added".
 *  3. Read-modify-write of one array is a lost-update race: two concurrent
 *     signups, one silently dropped.
 *  4. Reads used a bare `fetch(blob.url)`, which cannot work once access is
 *     private.
 *
 * One immutable record per submission means no read-before-write, no race, no
 * overwrite flag, and each record can carry the full payload plus request
 * metadata instead of just an email string. Costs one extra API call per lead,
 * which is irrelevant at this volume.
 */
const LEAD_PREFIX = "leads";

export function leadPrefix(kind: LeadKind) {
  return `${LEAD_PREFIX}/${kind}/`;
}

/**
 * True when Blob writes can actually happen. On Vercel, auth comes from an
 * auto-rotating OIDC token, so no static credential is needed; locally it
 * requires BLOB_READ_WRITE_TOKEN (via `vercel env pull`).
 */
export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL);
}

export async function storeLead(
  record: LeadRecord,
): Promise<{ stored: boolean; error?: string }> {
  if (!blobConfigured()) {
    // Local dev without credentials: don't fail the user's submission over it.
    console.warn(
      `[leads] Blob not configured; ${record.kind} lead not persisted:`,
      record.email,
    );
    return { stored: false, error: "not-configured" };
  }

  // Colons are legal in blob pathnames but awkward in URLs and CLI output.
  const stamp = record.receivedAt.replace(/[:.]/g, "-");
  const pathname = `${leadPrefix(record.kind)}${stamp}.json`;

  try {
    await put(pathname, JSON.stringify(record, null, 2), {
      access: "private",
      addRandomSuffix: true,
      contentType: "application/json",
    });
    return { stored: true };
  } catch (err) {
    // Never surface storage failures to the visitor — the caller decides how to
    // degrade. For contact submissions the email is the backup; for newsletter
    // signups a lost record is preferable to a scary error.
    console.error(`[leads] Failed to persist ${record.kind} lead:`, err);
    return { stored: false, error: "write-failed" };
  }
}
