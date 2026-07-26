#!/usr/bin/env node
/**
 * Asserts the full legacy URL surface still resolves correctly.
 *
 * A missed `.php` redirect is a silent 404 on an indexed, possibly ad-targeted
 * URL that nobody notices for weeks. This is the only automated guard against
 * that, so it runs against every preview deploy and against production
 * immediately after cutover.
 *
 * Usage:
 *   node scripts/check-redirects.mjs --base http://localhost:3001
 *   node scripts/check-redirects.mjs --base https://www.houndawayfromhome.com
 *
 * Exits non-zero on any mismatch.
 */
import {
  ALL_REDIRECTS,
  MUST_404,
  SITEMAP_ROUTES,
  UNLISTED_ROUTES,
} from "../lib/routes.ts";

const baseArgIndex = process.argv.indexOf("--base");
const BASE = (
  baseArgIndex !== -1 ? process.argv[baseArgIndex + 1] : "http://localhost:3000"
).replace(/\/$/, "");

/** Trailing-slash variants of the legacy paths. Next normalizes these before
 * consulting the redirect table, so they're asserted separately rather than
 * being listed as their own rules. */
const TRAILING_SLASH_CASES = [
  ["/about/", "/aboutus"],
  ["/questions/", "/faqs"],
  ["/photos/", "/gallery"],
  ["/contact-us/", "/contactus"],
];

/** Results are grouped so the redirect layer can be read as green even while
 * later phases haven't built their pages yet. */
const groups = {
  REDIRECT: { pass: 0, failures: [] },
  CANONICAL: { pass: 0, failures: [] },
  GATED: { pass: 0, failures: [] },
  GONE: { pass: 0, failures: [] },
};

function record(ok, group, label, detail) {
  if (ok) {
    groups[group].pass++;
  } else {
    groups[group].failures.push(`${label}\n    ${detail}`);
  }
  process.stdout.write(ok ? "." : "F");
}

/** Resolve a Location header against BASE so relative and absolute forms compare equal. */
function normalizeLocation(location) {
  if (!location) return null;
  try {
    return new URL(location, BASE).toString().replace(/\/$/, "") || location;
  } catch {
    return location;
  }
}

function expectedUrl(destination) {
  if (/^https?:\/\//.test(destination)) return destination.replace(/\/$/, "");
  return new URL(destination, BASE).toString().replace(/\/$/, "");
}

const PERMANENT_CODES = new Set([301, 308]);
const TEMPORARY_CODES = new Set([302, 307]);
const MAX_HOPS = 5;

/**
 * Follows the redirect chain and asserts where it LANDS, plus that every hop
 * preserves the intended cache semantics.
 *
 * Chains are expected in one specific case: Next normalizes trailing slashes
 * before consulting the redirect table, so `/photos/` serves 308 -> `/photos`
 * and only then 301 -> `/gallery`. That extra hop is unavoidable without
 * intercepting in proxy.ts, and two permanent hops on a decade-dead URL is not
 * worth a per-request function. What must NOT happen is a permanent chain
 * containing a temporary hop (or vice versa), because that silently changes
 * cacheability — so the mix is what's asserted.
 */
async function checkRedirect(source, destination, permanent) {
  const wantCodes = permanent ? PERMANENT_CODES : TEMPORARY_CODES;
  const label = `${source} -> ${destination} (${permanent ? "permanent" : "temporary"})`;
  try {
    const hops = [];
    let url = BASE + source;
    for (let i = 0; i < MAX_HOPS; i++) {
      const res = await fetch(url, { redirect: "manual" });
      if (!PERMANENT_CODES.has(res.status) && !TEMPORARY_CODES.has(res.status)) {
        break;
      }
      const next = normalizeLocation(res.headers.get("location"));
      hops.push({ status: res.status, to: next });
      if (!next || next === url) break;
      url = next;
      // Don't chase off-site destinations.
      if (!url.startsWith(BASE)) break;
    }

    if (hops.length === 0) {
      record(false, "REDIRECT", label, "no redirect issued");
      return;
    }
    const landed = hops[hops.length - 1].to;
    const wantLocation = expectedUrl(destination);
    const landedOk = landed === wantLocation;
    const semanticsOk = hops.every((h) => wantCodes.has(h.status));
    const trail = hops.map((h) => `${h.status}->${h.to}`).join(" ");
    record(
      landedOk && semanticsOk,
      "REDIRECT",
      label,
      `chain: ${trail}; want landing=${wantLocation} all-${permanent ? "permanent" : "temporary"}`,
    );
  } catch (err) {
    record(false, "REDIRECT", label, `request failed: ${err.message}`);
  }
}

async function checkStatus(path, wantStatus, group) {
  const label = `${path} (want ${wantStatus})`;
  try {
    const res = await fetch(BASE + path, { redirect: "manual" });
    record(
      res.status === wantStatus,
      group,
      label,
      `got status=${res.status}`,
    );
  } catch (err) {
    record(false, group, label, `request failed: ${err.message}`);
  }
}

console.log(`Checking redirects against ${BASE}\n`);

for (const { source, destination, permanent } of ALL_REDIRECTS) {
  await checkRedirect(source, destination, permanent);
}
for (const [source, destination] of TRAILING_SLASH_CASES) {
  await checkRedirect(source, destination, true);
}

// Canonical pages must return 200 directly, with no redirect hop.
for (const { path } of SITEMAP_ROUTES) {
  await checkStatus(path, 200, "CANONICAL");
}
for (const path of UNLISTED_ROUTES) {
  // /admin/leads is password-gated: 401 is the correct answer there.
  if (path.startsWith("/admin")) {
    await checkStatus(path, 401, "GATED");
  } else {
    await checkStatus(path, 200, "CANONICAL");
  }
}

// Dev scaffolding and POST handlers must be gone, not redirected.
for (const path of MUST_404) {
  await checkStatus(path, 404, "GONE");
}

console.log("\n");

let totalFail = 0;
for (const [name, g] of Object.entries(groups)) {
  const total = g.pass + g.failures.length;
  if (total === 0) continue;
  totalFail += g.failures.length;
  const verdict = g.failures.length === 0 ? "OK" : `${g.failures.length} FAILED`;
  console.log(`${name}: ${g.pass}/${total} ${verdict}`);
  for (const f of g.failures) console.log(`  - ${f}`);
  console.log("");
}

if (totalFail === 0) {
  console.log("All checks passed.");
} else {
  console.log(`${totalFail} check(s) failed.`);
}
process.exit(totalFail === 0 ? 0 : 1);
