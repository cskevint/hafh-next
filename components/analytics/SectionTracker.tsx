"use client";

import { useEffect, useRef } from "react";
import { trackSectionView, type TrackedSection } from "@/lib/analytics";

/**
 * Fires a Meta ViewContent event the first time a section scrolls into view.
 *
 * Replaces the PHP's scroll+resize listener that walked every <h1> and fired
 * for those carrying an id. That coupling is deliberately broken here.
 *
 * WHY IT MATTERS: verified against production, the page has TEN h1s but only
 * SEVEN fire — the hero and "Who this course is NOT for" have no id, the
 * "Coming soon!" h1 lives in a dead modal and is never visible, and #why-choose
 * / #prelaunch have ids but are h2/h3 so the tracker skips them. Fixing the
 * heading hierarchy (ten h1s is an SEO and a11y problem) would therefore have
 * SILENTLY CHANGED the event set and corrupted the Meta historical comparison.
 *
 * Tracking now hangs off an explicit wrapper, so headings can be corrected
 * freely while the event stream stays byte-identical.
 *
 * IntersectionObserver fires immediately for elements already intersecting at
 * observe time, which preserves the old "fires for whatever is in the viewport
 * on load" behavior exactly.
 */
export function SectionTracker({
  name,
  children,
}: {
  name: TrackedSection;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            trackSectionView(name);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [name]);

  return <div ref={ref}>{children}</div>;
}
