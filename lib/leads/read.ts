import { get, list } from "@vercel/blob";
import { blobConfigured, leadPrefix, type LeadKind, type LeadRecord } from "./store";

/**
 * Reads stored leads back for /admin/leads.
 *
 * Private blobs are NOT publicly fetchable, so this goes through the
 * authenticated SDK `get()` rather than `fetch(blob.url)`. The earlier
 * migration attempt used a bare fetch, which cannot work once access is
 * private — that was the specific API the plan flagged as unverified.
 */
export async function readLeads(
  kind: LeadKind,
  limit = 500,
): Promise<{ configured: boolean; leads: LeadRecord[] }> {
  if (!blobConfigured()) return { configured: false, leads: [] };

  try {
    const { blobs } = await list({ prefix: leadPrefix(kind), limit });

    const records = await Promise.all(
      blobs.map(async (blob) => {
        try {
          // get() resolves to null when the blob is missing (e.g. deleted
          // between the list and the read).
          const result = await get(blob.pathname, { access: "private" });
          if (!result) return null;
          const text = await new Response(result.stream).text();
          return JSON.parse(text) as LeadRecord;
        } catch (err) {
          console.error(`[leads] unreadable record ${blob.pathname}:`, err);
          return null;
        }
      }),
    );

    const leads = records.filter((r): r is LeadRecord => r !== null);
    // Newest first.
    leads.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
    return { configured: true, leads };
  } catch (err) {
    console.error(`[leads] list failed for ${kind}:`, err);
    return { configured: true, leads: [] };
  }
}

/** Unique emails, preserving newest-first order. Mirrors what admin/leads.php
 * displayed, which was a de-duplicated email list. */
export function uniqueEmails(leads: LeadRecord[]): string[] {
  return [...new Set(leads.map((l) => l.email).filter(Boolean))];
}
