"use client";

import { trackEnrollClick, type EnrollLocation } from "@/lib/analytics";

/**
 * The single enroll CTA, used seven times on the course page and three times in
 * the quiz results.
 *
 * The href comes from content/site.ts, which is also where the `?offer=`
 * ALLOWLIST lives — the PHP interpolated $_REQUEST['offer'] straight into the
 * Kajabi URL, so any visitor could change what the page sold via a query param.
 *
 * Styling is the PHP's inline CTA: #BD4D3D background, white text, no border,
 * pill, large shadow. That red is off-palette and appears nowhere else, which is
 * why it's the dedicated `cta` token.
 */
export function EnrollButton({
  href,
  location,
  children,
  className = "",
}: {
  href: string;
  location: EnrollLocation;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      data-location={location}
      onClick={() => trackEnrollClick(location)}
      className={`inline-block rounded-full bg-cta px-8 py-3 text-lg font-medium text-white shadow-lg transition-opacity hover:opacity-90 ${className}`}
    >
      {children}
    </a>
  );
}
