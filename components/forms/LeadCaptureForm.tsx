"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/schemas";
import { IDLE_STATE } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Shared name + email capture, used by the ebook and guide funnels and the
 * quiz's email gate.
 *
 * The ebook and guide actions end in redirect(), so on success this component
 * never re-renders — the navigation happens server-side. The quiz action returns
 * normally and the caller reveals the result panel.
 */
export function LeadCaptureForm({
  action,
  submitLabel,
  namePlaceholder = "Your name",
  emailPlaceholder = "Your email address",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  namePlaceholder?: string;
  emailPlaceholder?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-3" noValidate>
      {/* Honeypot */}
      <div className="hidden" aria-hidden>
        <label htmlFor="lead-fax">Fax Number</label>
        <input type="text" name="fax_number" id="lead-fax" tabIndex={-1} />
      </div>

      <div>
        <Input
          type="text"
          name="name"
          required
          placeholder={namePlaceholder}
          aria-label={namePlaceholder}
          aria-invalid={Boolean(errors.name) || undefined}
          className="h-auto bg-white py-3 text-lg"
        />
        {errors.name ? (
          <p className="mt-1 mb-0 text-left text-sm text-cta">{errors.name}</p>
        ) : null}
      </div>

      <div>
        <Input
          type="email"
          name="email"
          required
          placeholder={emailPlaceholder}
          aria-label={emailPlaceholder}
          aria-invalid={Boolean(errors.email) || undefined}
          className="h-auto bg-white py-3 text-lg"
        />
        {errors.email ? (
          <p className="mt-1 mb-0 text-left text-sm text-cta">{errors.email}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-auto w-full py-3 text-lg"
      >
        {pending ? "Sending..." : submitLabel}
      </Button>

      {state.status === "error" && state.message ? (
        <p role="alert" className="mb-0 text-sm text-cta">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
