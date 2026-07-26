import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";
import { CONTENT_UPDATED, SITEMAP_ROUTES } from "@/lib/routes";

/**
 * Replaces the hand-maintained sitemap.xml.
 *
 * The old file listed the four main pages WITH `.php` and the four funnel pages
 * WITHOUT, so half of it pointed at URLs that now 301. This emits only the
 * canonical extensionless form.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_ROUTES.map(({ path, priority }) => ({
    url: new URL(path, SITE.url).toString(),
    lastModified: CONTENT_UPDATED,
    priority,
  }));
}
