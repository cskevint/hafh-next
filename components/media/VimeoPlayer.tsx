"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const VIMEO_ID = "1055048384";
const VIMEO_SRC = `https://player.vimeo.com/video/${VIMEO_ID}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`;

declare global {
  interface Window {
    Vimeo?: {
      Player: new (
        el: HTMLIFrameElement,
      ) => { on: (event: string, cb: () => void) => void };
    };
  }
}

/**
 * Gated guide video plus the course upsell modal.
 *
 * Reproduces both triggers from introductory-guide-video.php:
 *  1. Vimeo player 'ended' event.
 *  2. An exit-intent state machine: loaded -> blurred (tab hidden) -> focused
 *     (tab visible again) re-opens the modal. The PHP tracked this in a
 *     `window.modalState` global.
 *
 * The modal is shadcn Dialog rather than Bootstrap's, so it gets a focus trap
 * and Escape handling. The PHP opened it imperatively via
 * `new bootstrap.Modal('#enrollModal').show()`.
 */
export function VimeoPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [open, setOpen] = useState(false);
  /** Mirrors the PHP's modalState global. */
  const phase = useRef<"loaded" | "blurred" | "focused">("loaded");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://player.vimeo.com/api/player.js";
    script.async = true;
    script.onload = () => {
      if (!iframeRef.current || !window.Vimeo) return;
      const player = new window.Vimeo.Player(iframeRef.current);
      player.on("ended", () => {
        phase.current = "focused";
        setOpen(true);
      });
    };
    document.head.appendChild(script);

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        if (phase.current === "loaded") phase.current = "blurred";
      } else if (phase.current === "blurred") {
        phase.current = "focused";
        setOpen(true);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return (
    <>
      {/* 56.25% padding wrapper = 16:9, matching the PHP. */}
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          ref={iframeRef}
          src={VIMEO_SRC}
          title="Hound Away From Home introductory guide"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full rounded-lg"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-3xl">
              Don&apos;t miss out on this chance!
            </DialogTitle>
            <DialogDescription className="text-base">
              You are so close to learning about the full potential of running a
              dog boarding business from your own home.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild className="h-auto w-full py-3 text-lg">
              <Link href="/at-home-dog-boarding-course">
                Enroll in our course now!
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
