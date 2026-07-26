import { LANDING_DISCLAIMER } from "@/content/site";

/**
 * Legal footer for the funnel pages. Verbatim from the PHP, with two fixes:
 *  - the copyright year is derived rather than hardcoded to 2025
 *  - the site link is https, not http
 */
export function LegalFooter() {
  return (
    <footer className="mt-auto bg-brown text-white">
      <div className="container mx-auto space-y-2 p-5 text-center text-sm">
        <p className="mb-0">{LANDING_DISCLAIMER}</p>
        <p className="mb-0">
          &copy; {new Date().getFullYear()} HoundAwayFromHome.com. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
