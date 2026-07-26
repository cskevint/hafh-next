import type { Metadata } from "next";
import { headers } from "next/headers";
import { isAuthorized } from "@/lib/admin-auth";
import { readLeads, uniqueEmails } from "@/lib/leads/read";
import type { LeadKind } from "@/lib/leads/store";

export const metadata: Metadata = {
  title: "Leads",
  robots: { index: false, follow: false },
};

/** Never cache a page that renders PII. */
export const dynamic = "force-dynamic";

const KINDS: { kind: LeadKind; label: string }[] = [
  { kind: "newsletter", label: "Newsletter" },
  { kind: "ebook", label: "E-book" },
  { kind: "guide", label: "Guide" },
  { kind: "quiz", label: "Quiz" },
  { kind: "contact", label: "Contact" },
];

/**
 * Replaces admin/leads.php.
 *
 * The auth check is repeated here even though proxy.ts already gates /admin.
 * Proxy matchers are easy to get subtly wrong, and the failure mode is
 * publishing the customer list, so this page does not assume the proxy ran.
 *
 * (The PHP had the mirror-image bug: it issued a redirect for unauthorized IPs
 * but never called exit(), so it rendered the whole lead list anyway.)
 */
export default async function AdminLeadsPage() {
  const h = await headers();
  if (!isAuthorized(h.get("authorization"))) {
    return (
      <main className="p-10">
        <h1>Not authorized</h1>
      </main>
    );
  }

  const groups = await Promise.all(
    KINDS.map(async ({ kind, label }) => ({
      label,
      kind,
      ...(await readLeads(kind)),
    })),
  );

  const anyUnconfigured = groups.some((g) => !g.configured);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6">Leads</h1>

      {anyUnconfigured ? (
        <p className="mb-6 rounded border border-cta/40 bg-cta/10 p-3">
          Vercel Blob is not configured in this environment, so no leads can be
          read. Set <code>BLOB_READ_WRITE_TOKEN</code> locally (via{" "}
          <code>vercel env pull</code>); on Vercel this uses OIDC automatically.
        </p>
      ) : null}

      <div className="grid gap-8 md:grid-cols-2">
        {groups.map(({ label, kind, leads }) => (
          <section key={kind}>
            <h2 className="mb-2 text-2xl">
              {label}{" "}
              <span className="text-base font-normal text-espresso/60">
                ({leads.length})
              </span>
            </h2>
            {leads.length === 0 ? (
              <p className="text-espresso/60">No records.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {uniqueEmails(leads).map((email) => (
                  <li key={email} className="break-all">
                    {email}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
