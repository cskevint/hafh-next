"use client";

import { useState } from "react";

/**
 * Testimonial read-more toggle.
 *
 * The PHP did this in CSS: `.read-more.hidden .read-more-content { display:none }`
 * with JS removing the `hidden` class. Same behavior, but the hidden text is now
 * genuinely absent from the accessibility tree until expanded, and the toggle is
 * a real button rather than an <a> with no href.
 */
export function ReadMore({ more }: { more: string }) {
  const [expanded, setExpanded] = useState(false);

  if (expanded) return <span> {more}</span>;

  return (
    <>
      {" "}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-brand underline underline-offset-2 hover:opacity-80"
      >
        More...
      </button>
    </>
  );
}
