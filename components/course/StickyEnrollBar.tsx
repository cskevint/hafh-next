"use client";

import { useEffect, useState } from "react";
import { EnrollButton } from "./EnrollButton";

/**
 * Mobile-only persistent enroll CTA.
 *
 * The course page carries seven inline CTAs, which reads as plenty on a desktop
 * screen. On a phone the same page is ~24 screens tall and the gaps between
 * CTAs stretch to roughly six screens twice over — 6,051→10,215px and
 * 10,215→14,388px, spanning the course outline, the coach bio and the FAQs.
 * A reader who decides to buy in the middle of either stretch has to scroll
 * blind in one direction or the other to act on it.
 *
 * A bar fixes that without adding more inline buttons to a page that already
 * has seven. `lg:hidden` because the desktop layout never had the problem.
 */

/** Roughly the height of the hero. Showing the bar over the hero's own CTA
 * would just cover the page's opening with a duplicate of itself. */
const REVEAL_AFTER_PX = 700;

export function StickyEnrollBar({ href }: { href: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > REVEAL_AFTER_PX);
    onScroll(); // Set the initial state for a restored scroll position.
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    /* Always rendered and slid out of view rather than mounted on scroll: it
     * animates, and it keeps the button in the DOM so the analytics listener
     * and the accessibility tree are stable. `aria-hidden` + `inert` while it is
     * off screen so a keyboard or screen-reader user cannot reach a control they
     * cannot see — the seven inline CTAs already serve them. */
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-espresso/10 bg-white/95 px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] backdrop-blur transition-transform duration-200 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <EnrollButton
        href={href}
        location="sticky"
        className="block w-full text-center"
      >
        Enroll Now
      </EnrollButton>
    </div>
  );
}
