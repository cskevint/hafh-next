// Relative rather than the `@/` alias so scripts/check-redirects.mjs can import
// this module directly under plain Node, which does not resolve tsconfig paths.
import { enrollUrl } from "../content/site.ts";

/**
 * Single source of truth for the site's URL surface.
 *
 * next.config.ts (redirects), app/sitemap.ts, app/robots.ts, and
 * scripts/check-redirects.mjs all derive from this file, so a URL cannot drift
 * between the redirect table and the sitemap.
 *
 * CANONICAL FORM: extensionless, no trailing slash, www host, https.
 *
 * Background: Apache rewrote any extensionless path to `<path>.php`, so BOTH
 * `/faqs` and `/faqs.php` have been live and indexable for years. The old
 * sitemap.xml made it worse by listing the four main pages WITH `.php` and the
 * four funnel pages WITHOUT. Every `.php` URL therefore needs a 301, and the
 * sitemap needs to emit only the extensionless form.
 */

export type RedirectRule = {
  source: string;
  destination: string;
  permanent: boolean;
};

/** Bump when page content materially changes. Deliberately a constant rather
 * than `new Date()` so lastModified doesn't churn on every deploy, which reads
 * as content thrash to crawlers. */
export const CONTENT_UPDATED = new Date("2026-07-26T00:00:00.000Z");

/** Pages that exist and should be indexed, with sitemap priority. Mirrors the
 * old sitemap's priorities exactly. */
export const SITEMAP_ROUTES = [
  { path: "/", priority: 1.0 },
  { path: "/aboutus", priority: 0.8 },
  { path: "/faqs", priority: 0.8 },
  { path: "/gallery", priority: 0.8 },
  { path: "/contactus", priority: 0.8 },
  { path: "/at-home-dog-boarding-course", priority: 1.0 },
  { path: "/download-free-ebook", priority: 1.0 },
  { path: "/watch-introductory-guide", priority: 1.0 },
  { path: "/is-dog-boarding-right-for-me", priority: 1.0 },
] as const;

/**
 * Real pages deliberately EXCLUDED from the sitemap:
 *   /introductory-guide-video  — gated thank-you page, noindex via metadata
 *   /services                  — two-sentence stub; absent from today's sitemap too
 *   /admin/leads               — password-gated, renders PII
 */
export const UNLISTED_ROUTES = [
  "/introductory-guide-video",
  "/services",
  "/admin/leads",
] as const;

/**
 * `.php` -> extensionless. All 301: these URLs are indexed and the `.php` form
 * can never legitimately come back, so consolidating link equity is correct.
 */
const PHP_PAGE_REDIRECTS: RedirectRule[] = [
  { source: "/index.php", destination: "/", permanent: true },
  ...[
    "aboutus",
    "faqs",
    "gallery",
    "contactus",
    "services",
    "at-home-dog-boarding-course",
    "download-free-ebook",
    "watch-introductory-guide",
    "introductory-guide-video",
    "is-dog-boarding-right-for-me",
  ].map((slug) => ({
    source: `/${slug}.php`,
    destination: `/${slug}`,
    permanent: true,
  })),
];

/**
 * Legacy WordPress-era paths. The PHP served these as 302; upgrading to 301
 * finally passes the accumulated link equity, since they've been dead for years.
 *
 * Only the non-slash form is listed: Next normalizes trailing slashes by
 * default (trailingSlash: false), so `/about/` resolves to `/about` before the
 * redirect table is consulted. check-redirects.mjs asserts BOTH forms.
 */
const LEGACY_PATH_REDIRECTS: RedirectRule[] = [
  { source: "/about", destination: "/aboutus", permanent: true },
  { source: "/questions", destination: "/faqs", permanent: true },
  { source: "/photos", destination: "/gallery", permanent: true },
  { source: "/contact-us", destination: "/contactus", permanent: true },
];

/**
 * Marketing shortlinks — deliberately 302, NOT 301.
 *
 * These live in ad creative, QR codes, and email campaigns. A 301 is cached by
 * browsers more or less forever, so if one is ever repointed, everyone who hit
 * the old target once is permanently stranded. The PHP served these as 302 and
 * that was the right call.
 *
 * `/enroll` is the load-bearing case: its destination ALREADY changed once
 * (commit 68436c0, Feb 2026, learn.houndawayfromhome.com -> hafh.mykajabi.com).
 * A cached 301 there would send paying customers to a dead checkout with no way
 * to fix it.
 */
const SHORTLINK_TARGETS: Record<string, string> = {
  "/contact": "/contactus",
  "/ebook": "/download-free-ebook",
  "/guide": "/watch-introductory-guide",
  "/quiz": "/is-dog-boarding-right-for-me",
  "/course": "/at-home-dog-boarding-course",
  "/enroll": enrollUrl(),
};

const SHORTLINK_REDIRECTS: RedirectRule[] = Object.entries(
  SHORTLINK_TARGETS,
).map(([source, destination]) => ({ source, destination, permanent: false }));

/** `.php` forms of the shortlinks resolve straight to the FINAL destination,
 * not to the shortlink — one hop, never a chain. */
const SHORTLINK_PHP_REDIRECTS: RedirectRule[] = Object.entries(
  SHORTLINK_TARGETS,
).map(([source, destination]) => ({
  source: `${source}.php`,
  destination,
  permanent: false,
}));

export const ALL_REDIRECTS: RedirectRule[] = [
  ...PHP_PAGE_REDIRECTS,
  ...LEGACY_PATH_REDIRECTS,
  ...SHORTLINK_REDIRECTS,
  ...SHORTLINK_PHP_REDIRECTS,
];

/**
 * Legacy URLs that must 404 rather than redirect — POST handlers, dev
 * scaffolding, and the old error pages. Listed so check-redirects.mjs can
 * assert they are gone; no route exists for them, so they 404 naturally.
 */
export const MUST_404 = [
  "/404.php",
  "/500.php",
  "/contactus-mail.php",
  "/newsletter-capture.php",
  "/contact-capture.php",
  "/redirect.php",
  "/admin/updatesite.php",
  "/development.html",
] as const;
