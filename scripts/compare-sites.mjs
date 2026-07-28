#!/usr/bin/env node
/**
 * Compares every known URL on the legacy PHP site against the new Next.js
 * deployment and writes a CSV.
 *
 *   node scripts/compare-sites.mjs \
 *     --old https://www.houndawayfromhome.com \
 *     --new https://hafh-next.vercel.app \
 *     --out site-comparison.csv
 *
 * The URL list is built from the ACTUAL files in ../hafh-web plus the
 * .htaccess redirects, not from memory, so nothing is silently omitted.
 */
import { writeFileSync } from "node:fs";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

const OLD = arg("old", "https://www.houndawayfromhome.com").replace(/\/$/, "");
const NEW = arg("new", "https://hafh-next.vercel.app").replace(/\/$/, "");
const OUT = arg("out", "site-comparison.csv");

/**
 * Vercel's Attack Challenge Mode / firewall answers non-browser clients with
 * HTTP 403 and `x-vercel-mitigated: challenge` for EVERY path — including pages
 * that exist. Without detecting that, this script reports real pages as MISSING,
 * which is worse than reporting nothing.
 *
 * Either disable Attack Challenge Mode for the run, or pass an automation
 * bypass secret (Vercel → Project → Settings → Deployment Protection →
 * Protection Bypass for Automation):
 *
 *   node scripts/compare-sites.mjs --bypass <secret>
 */
const BYPASS = arg("bypass", process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";

/** Every .php page in the legacy site root. */
const PHP_PAGES = [
  "404", "500", "aboutus", "at-home-dog-boarding-course", "contact-capture",
  "contact", "contactus-mail", "contactus", "course", "download-free-ebook",
  "ebook", "enroll", "faqs", "gallery", "guide", "index",
  "introductory-guide-video", "is-dog-boarding-right-for-me",
  "newsletter-capture", "quiz", "redirect", "services",
  "watch-introductory-guide",
];

/** Pages a visitor is meant to land on. Everything else is a handler, an alias,
 * or dev scaffolding, and is EXPECTED to be gone on the new site. */
const REAL_PAGES = new Set([
  "aboutus", "at-home-dog-boarding-course", "contactus", "download-free-ebook",
  "faqs", "gallery", "index", "introductory-guide-video",
  "is-dog-boarding-right-for-me", "services", "watch-introductory-guide",
]);

/** Marketing shortlinks — expected to redirect, not to render. */
const SHORTLINKS = new Set(["contact", "course", "ebook", "enroll", "guide", "quiz"]);

/** POST handlers and dev scaffolding — expected to 404 on the new site. */
const EXPECTED_GONE = new Set([
  "contact-capture", "contactus-mail", "newsletter-capture", "redirect",
  "404", "500",
]);

const urls = [];
const add = (path, category) => urls.push({ path, category });

add("/", "homepage");
for (const p of PHP_PAGES) {
  add(`/${p}.php`, "php-page");
  if (p !== "index") add(`/${p}`, "extensionless");
}
// Legacy WordPress-era paths from .htaccess, both slash forms.
for (const p of ["about", "questions", "photos", "contact-us"]) {
  add(`/${p}/`, "legacy-path");
  add(`/${p}`, "legacy-path");
}
add("/admin/leads", "admin");
add("/admin/leads.php", "admin");
add("/admin/updatesite", "admin");
add("/admin/updatesite.php", "admin");
add("/robots.txt", "static");
add("/sitemap.xml", "static");
add("/browserconfig.xml", "static");
add("/development.html", "dev-scaffolding");

const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);
const MAX_HOPS = 6;

/** Follows the redirect chain, returning the status trail and where it lands. */
async function probe(base, path) {
  let url = base + path;
  const chain = [];
  try {
    for (let i = 0; i < MAX_HOPS; i++) {
      const res = await fetch(url, {
        redirect: "manual",
        headers: {
          "user-agent": UA,
          ...(BYPASS
            ? {
                "x-vercel-protection-bypass": BYPASS,
                "x-vercel-set-bypass-cookie": "true",
              }
            : {}),
        },
        signal: AbortSignal.timeout(20000),
      });
      // A firewall challenge is not a routing answer — flag it, don't score it.
      if (res.headers.get("x-vercel-mitigated")) {
        return {
          status: res.status,
          chain,
          final: url,
          challenged: true,
        };
      }
      if (!REDIRECT_CODES.has(res.status)) {
        return { status: res.status, chain, final: url };
      }
      const loc = res.headers.get("location");
      chain.push(`${res.status}`);
      if (!loc) return { status: res.status, chain, final: url };
      const next = new URL(loc, url).toString();
      if (next === url) return { status: res.status, chain, final: url };
      // Don't chase off-site destinations. Kajabi bot-blocks curl, and its
      // status says nothing about whether OUR redirect is correct — what
      // matters is where we sent the visitor. Record it and stop.
      if (!next.startsWith(base)) {
        return { status: res.status, chain, final: next, external: true };
      }
      url = next;
    }
    return { status: 0, chain, final: url, error: "too-many-redirects" };
  } catch (err) {
    return { status: 0, chain, final: url, error: err.message.slice(0, 60) };
  }
}

/** Strip host so the two sites' landing spots are comparable. External
 * destinations (Kajabi) keep their full URL. */
function landingKey(finalUrl, base) {
  if (finalUrl.startsWith(base)) {
    const p = finalUrl.slice(base.length) || "/";
    return p.replace(/\/$/, "") || "/";
  }
  return finalUrl.replace(/\/$/, "");
}

function verdict(entry, oldR, newR) {
  const name = entry.path.replace(/^\//, "").replace(/\.php$/, "");
  const oldLand = landingKey(oldR.final, OLD);
  const newLand = landingKey(newR.final, NEW);
  const oldOk = oldR.status >= 200 && oldR.status < 300;
  const newOk = newR.status >= 200 && newR.status < 300;

  if (newR.challenged || oldR.challenged) {
    return [
      "BLOCKED",
      "Vercel firewall challenge (x-vercel-mitigated) — not a routing result. " +
        "Disable Attack Challenge Mode or pass --bypass, then re-run.",
    ];
  }
  if (oldR.error || newR.error) return ["ERROR", oldR.error || newR.error];

  // Admin is intentionally password-gated now.
  if (entry.category === "admin") {
    if (entry.path.endsWith(".php")) {
      return newR.status === 404
        ? ["OK", "old deploy hook / PHP admin correctly gone"]
        : ["REVIEW", `expected 404, got ${newR.status}`];
    }
    return newR.status === 401
      ? ["OK", "now password-gated (was an IP allowlist)"]
      : ["REVIEW", `expected 401, got ${newR.status}`];
  }

  if (EXPECTED_GONE.has(name)) {
    return newR.status === 404
      ? ["OK", "handler/scaffolding intentionally removed"]
      : ["REVIEW", `expected 404, got ${newR.status}`];
  }
  if (entry.category === "dev-scaffolding") {
    return newR.status === 404
      ? ["OK", "dev scaffolding intentionally removed"]
      : ["REVIEW", `expected 404, got ${newR.status}`];
  }

  // Both land in the same place: the ideal outcome.
  if (oldLand === newLand && newOk) return ["OK", "same landing page"];

  // Both sites send the visitor off-site (the Kajabi checkout). Compare the
  // DESTINATION, not the remote host's status code.
  if (oldR.external || newR.external) {
    if (oldLand === newLand) return ["OK", `both redirect to ${newLand}`];
    return [
      "CHANGED",
      `old -> ${oldLand}; new -> ${newLand} (intentional: the old host is dead)`,
    ];
  }

  if (newOk && oldOk) {
    if (oldLand !== newLand) {
      // Canonicalization: /faqs.php now 301s to /faqs. Intended.
      if (newLand === oldLand.replace(/\.php$/, "")) {
        return ["OK", "canonicalized to extensionless"];
      }
      // /index.php -> / is the same canonicalization, just a special case.
      if (oldLand === "/index.php" && newLand === "/") {
        return ["OK", "canonicalized: /index.php -> /"];
      }
      return ["REVIEW", `old -> ${oldLand}, new -> ${newLand}`];
    }
    return ["OK", "reachable on both"];
  }

  if (oldOk && !newOk) {
    return ["MISSING", `reachable on old (${oldR.status}), new returns ${newR.status}`];
  }
  if (!oldOk && newOk) {
    return ["OK", `old returned ${oldR.status}; new serves it`];
  }
  if (oldR.status === 404 && newR.status === 404) {
    return ["OK", "absent on both"];
  }
  return ["REVIEW", `old ${oldR.status} -> ${oldLand}; new ${newR.status} -> ${newLand}`];
}

console.log(`Comparing\n  old: ${OLD}\n  new: ${NEW}\n  ${urls.length} URLs\n`);

/** Pace requests. An unthrottled burst from one IP trips Vercel's automatic
 * DDoS mitigation, which then answers every path with a 403 challenge — which
 * looks exactly like a broken deployment if you don't check the headers. */
const DELAY_MS = Number(arg("delay", "300"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [];
for (const entry of urls) {
  const [oldR, newR] = await Promise.all([
    probe(OLD, entry.path),
    probe(NEW, entry.path),
  ]);
  await sleep(DELAY_MS);
  const [status, note] = verdict(entry, oldR, newR);
  rows.push({
    path: entry.path,
    category: entry.category,
    old_status: oldR.status || "ERR",
    old_redirects: oldR.chain.join(">") || "-",
    old_lands_on: landingKey(oldR.final, OLD),
    new_status: newR.status || "ERR",
    new_redirects: newR.chain.join(">") || "-",
    new_lands_on: landingKey(newR.final, NEW),
    verdict: status,
    notes: note,
  });
  process.stdout.write(status === "OK" ? "." : status === "MISSING" ? "M" : "?");
}
console.log("\n");

const HEADERS = [
  "path", "category", "old_status", "old_redirects", "old_lands_on",
  "new_status", "new_redirects", "new_lands_on", "verdict", "notes",
];
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
writeFileSync(
  OUT,
  [HEADERS.join(","), ...rows.map((r) => HEADERS.map((h) => esc(r[h])).join(","))].join("\n") + "\n",
);

const counts = rows.reduce((acc, r) => ((acc[r.verdict] = (acc[r.verdict] ?? 0) + 1), acc), {});
console.log("Summary:");
for (const [k, v] of Object.entries(counts).sort()) console.log(`  ${k}: ${v}`);

const problems = rows.filter((r) => r.verdict !== "OK");
if (problems.length) {
  console.log("\nNeeds attention:");
  for (const p of problems) {
    console.log(`  [${p.verdict}] ${p.path}  old=${p.old_status} new=${p.new_status}  ${p.notes}`);
  }
}
console.log(`\nWrote ${OUT} (${rows.length} rows)`);
