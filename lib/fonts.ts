import { Lato } from "next/font/google";
import localFont from "next/font/local";

/**
 * Gilroy — headings (h1–h5). Self-hosted; not on Google Fonts.
 *
 * The PHP site registered seven Gilroy weights as seven SEPARATE font families
 * ("Gilroy-Black", "Gilroy-Bold", …) but only ever referenced "Gilroy-Medium".
 * Consequence: the hero h1 (`display-5 fw-bold`) asked for weight 700 from a
 * family that only declared 500, so the browser synthesized a fake bold.
 *
 * Here Gilroy is one family with three real weights, so 600/700 resolve to
 * actual cut files instead of a synthetic smear. Same typeface, better render.
 *
 * Converted from the original .ttf to .woff2 (420KB -> 140KB). The other 17
 * Gilroy files in the old repo were never referenced by any CSS rule.
 */
const gilroy = localFont({
  src: [
    { path: "../app/fonts/Gilroy-Medium.woff2", weight: "500", style: "normal" },
    {
      path: "../app/fonts/Gilroy-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    { path: "../app/fonts/Gilroy-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-gilroy",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/**
 * Lato — body copy, and h6.
 *
 * Weights and styles match the Google Fonts request the PHP <head> made.
 *
 * Note the original declared `font-family: "Lato", serif` — a serif fallback
 * under a sans face. That is almost certainly a typo, but it only shows while
 * the webfont loads, and next/font inlines a size-adjusted fallback anyway, so
 * we use a sans stack here.
 */
const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-lato",
  display: "swap",
});

/** Inter was loaded on every page of the PHP site and referenced by no CSS
 * rule. Dropped rather than ported. */

export const fontVariables = `${gilroy.variable} ${lato.variable}`;
