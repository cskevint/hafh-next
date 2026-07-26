"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import { IDLE_STATE } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * The only client-side JS in the footer. Everything around it stays a Server
 * Component.
 *
 * `useActionState` gives inline success/error feedback scoped to this form. The
 * PHP round-tripped through a $_SESSION notice, and the earlier migration
 * attempt reimplemented that as a non-httpOnly cookie rendered via
 * dangerouslySetInnerHTML — a content-injection channel on every route. This
 * needs neither.
 *
 * The form still submits without JS: <form action={serverAction}> posts natively.
 */
export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(
    subscribeToNewsletter,
    IDLE_STATE,
  );

  return (
    <form action={formAction} className="mt-3" noValidate>
      {/* Honeypot. Hidden from sight and from assistive tech; bots fill it. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="newsletter-fax">Fax Number</label>
        <input
          id="newsletter-fax"
          type="text"
          name="fax_number"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex gap-2">
        <Input
          type="email"
          name="email"
          required
          autoComplete="off"
          placeholder="Your email address"
          aria-label="Your email address"
          aria-invalid={state.status === "error" || undefined}
          aria-describedby="newsletter-status"
          className="bg-white"
        />
        <Button
          type="submit"
          disabled={pending}
          variant="secondary"
          size="lg"
          aria-label="Sign up for the newsletter"
        >
          <Send className="size-4" />
        </Button>
      </div>

      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        className={`mt-2 min-h-5 text-sm ${
          state.status === "error" ? "text-cta" : "text-espresso"
        }`}
      >
        {state.message ?? ""}
      </p>
    </form>
  );
}
