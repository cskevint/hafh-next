import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MobilePreview, type PreviewParams } from "./MobilePreview";

/**
 * Dev-only mobile preview harness — see MobilePreview.tsx for why it frames the
 * site rather than shrinking a container.
 *
 * The production guard is the whole reason this can live in the repo: the route
 * cannot be reached on a deploy, so it needs no auth and leaks no surface. The
 * noindex metadata is belt-and-braces for anyone running a production build
 * locally.
 *
 * Deliberately outside the (main) / (landing) / (course) route groups so it
 * inherits only the root layout and renders no site chrome of its own — the
 * only header and footer on screen belong to the page under test.
 */
export const metadata: Metadata = {
  title: "Mobile preview",
  robots: { index: false, follow: false },
};

const DEFAULTS: PreviewParams = {
  path: "/",
  w: 393,
  h: 852,
  mode: "device",
  fold: 0,
};

export default async function DevMobilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const sp = await searchParams;
  const first = (key: string): string | undefined => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (key: string, fallback: number): number => {
    const n = Number(first(key));
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  /* Only same-origin absolute paths are framed. Anything else falls back to
   * "/" — this is a dev tool, but an open frame target invites confusion at
   * best and a phishing-shaped demo at worst. */
  const rawPath = first("path") ?? DEFAULTS.path;
  const path =
    rawPath.startsWith("/") && !rawPath.startsWith("//")
      ? rawPath
      : DEFAULTS.path;

  const initial: PreviewParams = {
    path,
    w: num("w", DEFAULTS.w),
    h: num("h", DEFAULTS.h),
    mode: first("mode") === "filmstrip" ? "filmstrip" : "device",
    fold: Math.max(0, Math.trunc(num("fold", 0)) || 0),
  };

  return <MobilePreview initial={initial} />;
}
