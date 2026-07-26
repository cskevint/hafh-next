import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

/**
 * Replaces robots.txt.
 *
 * The old file did `Disallow: /introductory-guide-video` while that page ALSO
 * carried `<meta name="robots" content="noindex">`. Those fight each other: a
 * disallowed page can't be crawled, so Google never sees the noindex and the
 * URL can still surface as a bare listing.
 *
 * Correct pattern, applied here: no Disallow, and the page declares
 * `robots: { index: false }` in its own metadata so crawlers can actually read
 * the directive. /admin is disallowed because it's genuinely off-limits and is
 * password-gated regardless.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin/" }],
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
  };
}
