import type { NextConfig } from "next";
import { ALL_REDIRECTS } from "./lib/routes";

const nextConfig: NextConfig = {
  /**
   * Redirects live here rather than in proxy.ts on purpose: `redirects()`
   * compiles into Vercel's routing layer and resolves before any function boots,
   * whereas proxy runs per-request in-region and is billed per invocation.
   *
   * The table derives from lib/routes.ts so the sitemap cannot drift from it.
   * See that file for why some rules are 301 and others are deliberately 302.
   */
  async redirects() {
    return ALL_REDIRECTS;
  },
};

export default nextConfig;
