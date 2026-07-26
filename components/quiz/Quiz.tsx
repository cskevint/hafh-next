"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  QUIZ_QUESTIONS,
  TOTAL_QUESTIONS,
  getQuizResult,
  type QuizAnswers,
  type QuizResult,
} from "@/content/quiz";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LeadCaptureForm } from "@/components/forms/LeadCaptureForm";
import { QuizResultPanel } from "@/components/quiz/results";
import { captureQuizLead } from "@/lib/actions/lead-capture";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { FormState } from "@/lib/schemas";

/**
 * Quiz state machine.
 *
 * ARCHITECTURE: client state is the source of truth; only the STEP NUMBER is
 * mirrored to the URL via history.pushState.
 *
 * Why the step is in the URL: Back is the control users actually exercise in a
 * 7-step quiz, and with pure client state Back exits the page entirely and loses
 * all seven answers. Next has supported bare pushState since 14.1, so this costs
 * no server round trip, and existing `?question=N` deep links keep working.
 *
 * Why the ANSWERS are NOT in the URL — two reasons the PHP got wrong:
 *
 *  1. THE LEAD GATE WAS BYPASSABLE. getRenderState() computed the result purely
 *     from count($_SESSION['quiz']) == 7, so a visitor could answer everything,
 *     land on the email form, then hand-edit the URL to ?question=DONE and read
 *     their results without ever submitting an email. On a page whose entire
 *     purpose is lead capture, that's a two-second bypass. Here the result panel
 *     only renders after the capture action returns success. Still
 *     devtools-bypassable — a conversion mechanism, not a security boundary —
 *     but it closes the one real people find.
 *  2. `?question=4&previousQuestion=work&previousAnswer=strict-hours` is a
 *     shareable URL containing a stranger's answers about their housing and
 *     employment, and is likely why Google crawled a combinatorial explosion of
 *     parameterized variants of this page.
 *
 * Polish that adds no copy and restructures nothing: a progress indicator (the
 * PHP had none, and 7-step quizzes without one complete measurably worse) and an
 * explicit Back button.
 */
type Phase = "questions" | "email" | "result";

export function Quiz({ initialStep }: { initialStep: number }) {
  const [step, setStep] = useState(initialStep);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [phase, setPhase] = useState<Phase>("questions");
  const [result, setResult] = useState<QuizResult | null>(null);

  /** Mirror the step into the URL without a server round trip. */
  const pushStep = useCallback((next: number) => {
    const url = next === 0 ? "?" : `?question=${next}`;
    window.history.pushState(null, "", url);
  }, []);

  /** Browser Back/Forward moves between questions rather than leaving. */
  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const raw = Number(params.get("question") ?? 0);
      const clamped =
        Number.isFinite(raw) && raw >= 0 && raw < TOTAL_QUESTIONS
          ? Math.floor(raw)
          : 0;
      setStep(clamped);
      setPhase("questions");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  /** Any stale ?question=EMAIL / DONE / out-of-range value arrives already
   * normalized to 0 by the server; clean it out of the URL on mount so it isn't
   * shared or re-crawled. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("question");
    const stale =
      params.has("previousQuestion") ||
      params.has("previousAnswer") ||
      (q !== null && !/^\d+$/.test(q));
    if (stale) {
      window.history.replaceState(null, "", initialStep === 0 ? "/is-dog-boarding-right-for-me" : `?question=${initialStep}`);
    }
  }, [initialStep]);

  function answer(name: string, value: string) {
    const next = { ...answers, [name]: value };
    setAnswers(next);
    if (step + 1 < TOTAL_QUESTIONS) {
      const nextStep = step + 1;
      setStep(nextStep);
      pushStep(nextStep);
    } else {
      setPhase("email");
      setResult(getQuizResult(next));
    }
  }

  function goBack() {
    if (phase === "email") {
      setPhase("questions");
      return;
    }
    if (step > 0) {
      const prev = step - 1;
      setStep(prev);
      pushStep(prev);
    }
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setPhase("questions");
    setResult(null);
    window.history.replaceState(null, "", "/is-dog-boarding-right-for-me");
  }

  /** Reveal results only once the lead is captured. */
  async function onCapture(prev: FormState, formData: FormData) {
    const state = await captureQuizLead(prev, formData);
    if (state.status === "success") setPhase("result");
    return state;
  }

  const question = QUIZ_QUESTIONS[step];
  const showLargeHeader = step === 0 && phase === "questions";

  return (
    <>
      <LandingHeader
        size={showLargeHeader ? "large" : "small"}
        tagline={
          showLargeHeader
            ? "Is dog-boarding right for you? Take a quiz to find out!"
            : undefined
        }
      />

      <section className="bg-bone">
        <main className="container mx-auto max-w-3xl p-6 lg:p-12">
          {phase === "questions" && question ? (
            <>
              <div className="mb-6">
                <Progress
                  value={((step + 1) / TOTAL_QUESTIONS) * 100}
                  className="h-2"
                />
                <p className="mt-2 mb-0 text-sm text-espresso/60">
                  Question {step + 1} of {TOTAL_QUESTIONS}
                </p>
              </div>

              <h2 className="mb-6">{question.title}</h2>

              <div className="grid gap-3">
                {question.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => answer(question.name, option.value)}
                    className="rounded-lg border border-brand p-4 text-left text-lg text-brand transition-colors hover:bg-brand hover:text-white"
                  >
                    {option.text}
                  </button>
                ))}
              </div>

              {step > 0 ? (
                <Button
                  variant="ghost"
                  onClick={goBack}
                  className="mt-6 h-auto px-3 py-2"
                >
                  <ArrowLeft className="size-4" /> Back
                </Button>
              ) : null}
            </>
          ) : null}

          {phase === "email" ? (
            <>
              <h2 className="mb-6">
                To get your results, provide your name and email:
              </h2>
              <LeadCaptureForm
                action={onCapture}
                submitLabel="Get my results!"
              />
              <Button
                variant="ghost"
                onClick={goBack}
                className="mt-6 h-auto px-3 py-2"
              >
                <ArrowLeft className="size-4" /> Back
              </Button>
            </>
          ) : null}

          {phase === "result" && result ? (
            <>
              <QuizResultPanel result={result} />
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  variant="outline"
                  onClick={restart}
                  className="h-auto px-4 py-2"
                >
                  Start over
                </Button>
                <Link
                  href="/at-home-dog-boarding-course"
                  className="text-brown underline-offset-4 hover:underline"
                >
                  Learn about our online course!
                </Link>
              </div>
            </>
          ) : null}
        </main>
      </section>
    </>
  );
}
