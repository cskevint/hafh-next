/**
 * Thin typed facade over Meta Pixel and GA4.
 *
 * This is the replacement for the dev stub in includes/head-tag-contents.php,
 * which defined `window.fbq = (action, event, args) => console.log(...)` when
 * not in production. That stub was load-bearing: the course page calls
 * fbq('track', …) from three separate listeners unconditionally, so WITHOUT it
 * every call throws a ReferenceError in dev and on every preview deploy — and
 * takes the surrounding handler down with it, which silently breaks the
 * accordion's expand-all click handler mid-function.
 *
 * The earlier migration attempt dropped the stub and left the pixel id as the
 * literal string 'YOUR_PIXEL_ID'.
 *
 * The FbqEvent union is deliberate: a typo in an event name would silently
 * orphan a Meta ad audience with no error anywhere.
 */
export type FbqEvent =
  | "Lead"
  | "ViewContent"
  | "VideoPlay"
  | "VideoPause"
  | "VideoComplete";

/** The seven section names the PHP's h1 tracker actually fired for. Verified
 * against production — see plans/ Phase 0 findings. Adding to this set changes
 * event volume and makes before/after ad comparisons uninterpretable. */
export type TrackedSection =
  | "testimonials"
  | "learn"
  | "outline"
  | "coach"
  | "audience"
  | "faqs"
  | "disclaimer";

/** The enroll button positions, typed so a misspelling can't quietly lose an
 * attribution bucket.
 *
 * `sticky` is the mobile-only bar and is NEW — it did not exist in the PHP. It
 * gets its own bucket rather than reusing a nearby section's, so the seven
 * original buckets stay directly comparable to their historical volume. Total
 * enroll clicks will rise, because there is now a CTA on screen during the two
 * long stretches that previously had none; that is the intended effect, not
 * drift. Read `sticky` separately when comparing before and after. */
export type EnrollLocation =
  | "header"
  | "discount"
  | "testimonials"
  | "learn"
  | "why-choose"
  | "prelaunch"
  | "faqs"
  | "sticky";

declare global {
  interface Window {
    fbq?: (
      action: string,
      event: string,
      params?: Record<string, string>,
    ) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function fbqTrack(
  event: FbqEvent,
  params?: Record<string, string>,
): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") {
    if (process.env.NODE_ENV !== "production") {
      console.log("[fbq]", event, params ?? "");
    }
    return;
  }
  window.fbq("track", event, params);
}

export function trackEnrollClick(location: EnrollLocation): void {
  fbqTrack("Lead", { content_name: location, content_type: "button" });
}

export function trackSectionView(name: TrackedSection): void {
  // content_type stays 'heading' even though tracking now hangs off a section
  // wrapper rather than an h1 — changing it would fork the Meta event history.
  fbqTrack("ViewContent", { content_name: name, content_type: "heading" });
}

export function trackCourseOutlineExpand(): void {
  fbqTrack("ViewContent", {
    content_type: "section",
    content_name: "course-outline",
  });
}

/**
 * True when analytics scripts should load.
 *
 * Gated on VERCEL_ENV rather than the PHP's STAGE, plus an explicit debug
 * escape hatch — without one you cannot verify pixel parity on a preview
 * deploy, which is exactly when you need to.
 */
export function analyticsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ANALYTICS_MODE === "debug") return true;
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
}
