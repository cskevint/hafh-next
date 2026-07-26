"use client";

import { useEffect, useRef } from "react";

/**
 * Replaces the three animated GIFs on the course page.
 *
 * Those GIFs were 18.5MB combined, all in the critical path of the highest-value
 * page on the site. Re-encoded to VP9/WebM plus an H.264/MP4 fallback: ~1.5MB
 * for whichever the browser picks, a ~92% reduction.
 *
 * Two behaviors the GIF got for free that a <video> does not:
 *  - iOS Low Power Mode blocks autoplay even when muted, so `poster` must be a
 *    REAL first frame rather than a placeholder — otherwise those users see a
 *    grey box on the money page.
 *  - prefers-reduced-motion: GIFs ignore it; here we pause rather than autoplay.
 */
export function LoopingVideo({
  src,
  poster,
  alt,
  className = "",
}: {
  /** Basename without extension, e.g. "/images/course/learn_business" */
  src: string;
  poster: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      video.autoplay = false;
      video.pause();
      video.controls = true;
    }
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      poster={poster}
      aria-label={alt}
      className={className}
    >
      <source src={`${src}.webm`} type="video/webm" />
      <source src={`${src}.mp4`} type="video/mp4" />
    </video>
  );
}
