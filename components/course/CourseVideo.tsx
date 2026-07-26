"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { fbqTrack } from "@/lib/analytics";

const VIDEO_ID = "tqOzM1y0xxA";

/**
 * Hero YouTube embed, as a click-to-load facade.
 *
 * The PHP rendered an eager <iframe> right beside the h1 — several hundred KB of
 * third-party JS competing with LCP on the highest-value page on the site.
 *
 * next/third-parties' YouTubeEmbed would fix the weight but exposes no JS API,
 * which would lose the VideoPlay/VideoPause/VideoComplete events the Meta
 * optimizer runs on. So this hand-rolls the facade: poster + play button, and on
 * click it mounts the real iframe with the IFrame API attached.
 *
 * One deliberate semantic shift: VideoPlay now fires from the explicit click
 * rather than from onStateChange. Same meaning, and the LCP win is large.
 */
export function CourseVideo() {
  const [active, setActive] = useState(false);

  function start() {
    setActive(true);
    fbqTrack("VideoPlay");
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={start}
        aria-label="Play the course introduction video"
        className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-espresso"
      >
        {/* YouTube's own thumbnail — no extra asset to ship. */}
        <picture>
          <img
            src={`https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
        </picture>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-cta/90 shadow-lg transition-transform group-hover:scale-110">
            <Play className="size-9 translate-x-0.5 fill-white text-white" />
          </span>
        </span>
      </button>
    );
  }

  return (
    <iframe
      src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&enablejsapi=1`}
      title="At-home dog boarding course introduction"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full rounded-xl"
    />
  );
}
