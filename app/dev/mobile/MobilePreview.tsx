"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SITEMAP_ROUTES, UNLISTED_ROUTES } from "@/lib/routes";
import {
  auditFrame,
  countBySeverity,
  formatReport,
  type AuditReport,
} from "./audit";

/**
 * Device-viewport preview harness. Dev only — the route 404s in production.
 *
 * WHY AN IFRAME AND NOT A NARROW CONTAINER
 * This site styles with Tailwind's media-query breakpoints (`sm:` / `md:` /
 * `lg:`), and media queries resolve against the VIEWPORT, never against a
 * parent element's width. Rendering the app inside a 393px-wide div would keep
 * every desktop branch active — the `lg:` nav would stay visible, the hamburger
 * would stay hidden — and produce screenshots that confidently show the wrong
 * layout. An iframe has a viewport of its own, so `min-width: 1024px` genuinely
 * evaluates false at 393px and the mobile branch renders for real.
 *
 * Verify that claim any time with the "Desktop (control)" preset: the nav
 * should flip between hamburger and full link row purely from the frame width.
 *
 * WHAT THIS DOES *NOT* REPRODUCE
 *  - Touch. There is no touch input and no mobile user-agent, and device pixel
 *    ratio is the desktop's.
 *  - Hover. `@media (hover: hover)` still matches inside the frame, so Tailwind
 *    `hover:` styles appear here that a phone will never show. Anything that
 *    depends on hover to be discoverable must be checked by reading the source.
 *  - iOS Safari's dynamic viewport / collapsing URL bar, so `100vh` and `dvh`
 *    behaviour is approximate.
 * It catches layout defects. A real device is still the final word.
 */

const DEVICES = [
  { name: "iPhone SE", w: 375, h: 667 },
  { name: "iPhone 15", w: 393, h: 852 },
  { name: "iPhone 15 Pro Max", w: 430, h: 932 },
  { name: "Pixel 8", w: 412, h: 915 },
  { name: "iPad mini", w: 744, h: 1133 },
  { name: "Desktop (control)", w: 1280, h: 800 },
] as const;

const FILMSTRIP_WIDTHS = [375, 393, 430, 744] as const;
const FILMSTRIP_HEIGHT = 900;

/** Carried over between folds so nothing is lost across a screenshot seam. */
const FOLD_OVERLAP = 64;

/** Fonts, images and hydration all shift the layout after `load` fires; audit
 * once immediately for responsiveness and again once things have settled. */
const SETTLE_MS = 700;

/** `/admin/leads` is HTTP-Basic gated by proxy.ts — framing it would just
 * render a 401. */
const PREVIEW_ROUTES: string[] = [
  ...SITEMAP_ROUTES.map((r) => r.path),
  ...UNLISTED_ROUTES,
].filter((p) => !p.startsWith("/admin"));

export type PreviewParams = {
  path: string;
  w: number;
  h: number;
  mode: "device" | "filmstrip";
  fold: number;
};

export function MobilePreview({ initial }: { initial: PreviewParams }) {
  const [path, setPath] = useState(initial.path);
  const [w, setW] = useState(initial.w);
  const [h, setH] = useState(initial.h);
  const [mode, setMode] = useState(initial.mode);
  const [fold, setFold] = useState(initial.fold);
  const [foldCount, setFoldCount] = useState(1);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const frameRef = useRef<HTMLIFrameElement>(null);

  /* Every control writes to the URL so the whole harness is drivable by
   * navigation alone — one address per screenshot, no click choreography. Uses
   * the native history API rather than the Next router on purpose: a router
   * navigation would re-render the server component and reload the frame,
   * throwing away the scroll position we just set. */
  useEffect(() => {
    const q = new URLSearchParams({
      path,
      w: String(w),
      h: String(h),
      mode,
      fold: String(fold),
    });
    window.history.replaceState(null, "", `/dev/mobile?${q.toString()}`);
  }, [path, w, h, mode, fold]);

  const measure = useCallback(() => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    const step = Math.max(1, h - FOLD_OVERLAP);
    const total = Math.ceil(
      Math.max(0, win.document.documentElement.scrollHeight - FOLD_OVERLAP) /
        step,
    );
    setFoldCount(Math.max(1, total));
  }, [h]);

  const scrollToFold = useCallback((n: number, height: number) => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    win.scrollTo({
      top: n * Math.max(1, height - FOLD_OVERLAP),
      left: 0,
      behavior: "instant",
    });
  }, []);

  const runAudit = useCallback(() => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    try {
      const next = auditFrame(win);
      setReport(next);
      setError(null);
      // Mirrored to the console so it can be read without a screenshot.
      console.log("[mobile-audit]", JSON.stringify(next));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  /* Read inside the sync effect so that changing folds does not re-trigger a
   * full re-measure and re-audit. */
  const foldRef = useRef(fold);
  useEffect(() => {
    foldRef.current = fold;
  }, [fold]);

  /* Measure, position and audit the frame whenever the thing under test
   * changes.
   *
   * POLLS rather than relying on the iframe's `load` event. The page is
   * server-rendered, so the browser starts fetching the frame from the initial
   * HTML and — for a warm dev server on localhost — routinely finishes before
   * React hydrates and attaches `onLoad`. That handler then never fires and the
   * audit sits on "waiting for frame…" forever. Polling `readyState` cannot
   * miss an event it never subscribed to. */
  useEffect(() => {
    if (mode !== "device") return;
    let settle = 0;

    const sync = () => {
      measure();
      scrollToFold(foldRef.current, h);
      runAudit();
    };

    let attempts = 0;
    const poll = window.setInterval(() => {
      attempts += 1;
      const win = frameRef.current?.contentWindow;
      const ready = win && win.document.readyState === "complete";
      /* On a path change the frame briefly still holds the PREVIOUS document,
       * already `complete` — auditing then would report the old page under the
       * new page's name. Wait until the frame's own location agrees. Give up
       * after ~4s and measure whatever is there rather than hanging, so a
       * redirect can never wedge the harness. */
      const settled =
        ready &&
        (win.location.pathname + win.location.search === path ||
          attempts > 40);
      if (!settled) return;
      window.clearInterval(poll);
      sync();
      /* Fonts and images reflow after `complete`; the second pass is the one
       * whose numbers are trustworthy. */
      settle = window.setTimeout(sync, SETTLE_MS);
    }, 100);

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(settle);
    };
  }, [path, w, h, mode, measure, scrollToFold, runAudit]);

  useEffect(() => {
    if (mode !== "device") return;
    scrollToFold(fold, h);
  }, [fold, h, mode, scrollToFold]);

  const counts = report ? countBySeverity(report) : null;
  const activeDevice = DEVICES.find((d) => d.w === w && d.h === h);

  return (
    <main className="min-h-screen bg-neutral-100 p-4 font-mono text-[13px] text-neutral-900">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4">
        <Controls
          path={path}
          setPath={setPath}
          w={w}
          h={h}
          setSize={(nw, nh) => {
            setW(nw);
            setH(nh);
            setFold(0);
          }}
          mode={mode}
          setMode={setMode}
          activeDevice={activeDevice?.name}
        />

        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-col gap-2">
            {mode === "device" ? (
              <>
                <FoldBar
                  fold={fold}
                  foldCount={foldCount}
                  setFold={setFold}
                  onRefresh={() => {
                    measure();
                    runAudit();
                  }}
                />
                {/* Rendered at exactly w×h with no transform, so screenshots
                 * are pixel-true against a real device's CSS viewport. */}
                <iframe
                  ref={frameRef}
                  title={`Preview of ${path} at ${w}×${h}`}
                  src={path}
                  style={{ width: w, height: h }}
                  className="border-2 border-neutral-800 bg-white"
                />
              </>
            ) : (
              <Filmstrip path={path} />
            )}
          </div>

          <section className="min-w-[420px] flex-1">
            <h2 className="mb-2 flex items-center gap-3 font-bold">
              <span>AUDIT</span>
              {counts ? (
                <span
                  className={
                    counts.critical > 0 ? "text-red-700" : "text-green-700"
                  }
                >
                  {counts.critical} critical / {counts.warning} warning
                </span>
              ) : null}
            </h2>
            <pre className="max-h-[80vh] overflow-auto border border-neutral-300 bg-white p-3 text-[12px] leading-relaxed whitespace-pre-wrap">
              {error
                ? `audit failed: ${error}`
                : mode !== "device"
                  ? "Audit runs in device mode only — switch back to measure a single viewport."
                  : report
                    ? formatReport(report)
                    : "waiting for frame…"}
            </pre>
            {/* The 44px threshold is a touch standard. At a desktop width the
              * tap-target check will light up for controls that are correct for
              * a mouse, so say so rather than let the count read as a defect. */}
            {w >= 1024 ? (
              <p className="mt-2 max-w-[70ch] text-[11px] leading-relaxed text-amber-800">
                Desktop width — tap-target findings do not apply here. 44px is a
                touch minimum; pointer-driven controls are legitimately smaller.
                Judge those findings at a phone or tablet width.
              </p>
            ) : null}
            <p className="mt-2 max-w-[70ch] text-[11px] leading-relaxed text-neutral-600">
              Reflects the frame&apos;s DOM as it stands right now. Content
              behind an interaction — the nav sheet, an accordion, a quiz step —
              is invisible to the audit until you open it in the frame and press
              Re-audit. Note also that <code>hover:</code> styles render here but
              never will on a phone.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function Controls({
  path,
  setPath,
  w,
  h,
  setSize,
  mode,
  setMode,
  activeDevice,
}: {
  path: string;
  setPath: (p: string) => void;
  w: number;
  h: number;
  setSize: (w: number, h: number) => void;
  mode: "device" | "filmstrip";
  setMode: (m: "device" | "filmstrip") => void;
  activeDevice?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-neutral-300 bg-white p-3">
      <label className="flex items-center gap-2">
        <span className="font-bold">PAGE</span>
        <select
          value={PREVIEW_ROUTES.includes(path) ? path : ""}
          onChange={(e) => setPath(e.target.value)}
          className="border border-neutral-400 px-2 py-1"
        >
          {!PREVIEW_ROUTES.includes(path) ? (
            <option value="">{path}</option>
          ) : null}
          {PREVIEW_ROUTES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap items-center gap-1">
        <span className="font-bold">DEVICE</span>
        {DEVICES.map((d) => (
          <button
            key={d.name}
            type="button"
            onClick={() => setSize(d.w, d.h)}
            className={`border px-2 py-1 ${
              activeDevice === d.name
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-400 bg-white hover:bg-neutral-100"
            }`}
          >
            {d.name} {d.w}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-1">
        <span className="font-bold">W</span>
        <input
          type="number"
          value={w}
          onChange={(e) => setSize(Number(e.target.value) || w, h)}
          className="w-20 border border-neutral-400 px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-1">
        <span className="font-bold">H</span>
        <input
          type="number"
          value={h}
          onChange={(e) => setSize(w, Number(e.target.value) || h)}
          className="w-20 border border-neutral-400 px-2 py-1"
        />
      </label>

      <button
        type="button"
        onClick={() => setMode(mode === "device" ? "filmstrip" : "device")}
        className="border border-neutral-400 bg-white px-2 py-1 hover:bg-neutral-100"
      >
        {mode === "device" ? "→ filmstrip" : "→ device"}
      </button>
    </div>
  );
}

function FoldBar({
  fold,
  foldCount,
  setFold,
  onRefresh,
}: {
  fold: number;
  foldCount: number;
  setFold: (n: number) => void;
  onRefresh: () => void;
}) {
  const btn =
    "border border-neutral-400 bg-white px-2 py-1 hover:bg-neutral-100 disabled:opacity-40";
  return (
    <div className="flex items-center gap-2">
      <span className="font-bold">FOLD</span>
      <button
        type="button"
        className={btn}
        disabled={fold <= 0}
        onClick={() => setFold(0)}
      >
        ⇤ top
      </button>
      <button
        type="button"
        className={btn}
        disabled={fold <= 0}
        onClick={() => setFold(fold - 1)}
      >
        ← prev
      </button>
      <span className="tabular-nums">
        {fold + 1} / {foldCount}
      </span>
      <button
        type="button"
        className={btn}
        disabled={fold >= foldCount - 1}
        onClick={() => setFold(fold + 1)}
      >
        next →
      </button>
      <button type="button" className={btn} onClick={onRefresh}>
        re-audit
      </button>
    </div>
  );
}

/** Side-by-side widths, for spotting the exact width a layout breaks at.
 * Scaled to fit, so it is for comparison — not for pixel judgements. */
function Filmstrip({ path }: { path: string }) {
  const scale = 0.55;
  return (
    <div className="flex gap-3">
      {FILMSTRIP_WIDTHS.map((fw) => (
        <div key={fw} className="flex flex-col gap-1">
          <span className="font-bold">{fw}px</span>
          <div
            style={{
              width: fw * scale,
              height: FILMSTRIP_HEIGHT * scale,
              overflow: "hidden",
            }}
            className="border-2 border-neutral-800 bg-white"
          >
            <iframe
              title={`Preview of ${path} at ${fw}px`}
              src={path}
              style={{
                width: fw,
                height: FILMSTRIP_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                border: 0,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
