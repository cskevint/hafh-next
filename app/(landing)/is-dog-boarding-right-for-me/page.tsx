import type { Metadata } from "next";
import { Quiz } from "@/components/quiz/Quiz";
import { TOTAL_QUESTIONS } from "@/content/quiz";

const DESCRIPTION =
  "Take a quiz to find out if at-home dog-boarding right for you!";

export const metadata: Metadata = {
  title: "Take a quiz!",
  description: DESCRIPTION,
  /* Keep the canonical: this was the ONLY canonical tag on the entire PHP site,
   * and it exists precisely because the old URL-state design generated a
   * combinatorial explosion of ?question=&previousAnswer= crawl variants. */
  alternates: { canonical: "/is-dog-boarding-right-for-me" },
  openGraph: {
    title: "Take a quiz!",
    description: DESCRIPTION,
    images: [{ url: "/images/share/course.jpg", width: 1200, height: 630 }],
  },
};

/**
 * Normalizes legacy `?question=` values.
 *
 * | incoming                       | behavior                                 |
 * |--------------------------------|------------------------------------------|
 * | 0..6                           | start at that question, no answers       |
 * | EMAIL / DONE                    | start at 0 (PHP did this for DONE too)   |
 * | 7, negative, non-numeric        | start at 0 — DEVIATION: the PHP 404'd,   |
 * |                                | but 404ing on a bad query param is a bad |
 * |                                | experience on a paid-traffic landing page|
 * | previousQuestion/previousAnswer | ignored, and stripped client-side        |
 */
function normalizeStep(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d+$/.test(value)) return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n >= TOTAL_QUESTIONS) return 0;
  return Math.floor(n);
}

export default async function QuizPage(props: {
  // searchParams is a Promise in Next 16 — synchronous access was removed.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  return <Quiz initialStep={normalizeStep(searchParams.question)} />;
}
