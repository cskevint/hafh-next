"use client";

import { useActionState, useState, useTransition } from "react";
import { Mail, Phone } from "lucide-react";
import { submitContact } from "@/lib/actions/contact";
import { IDLE_STATE } from "@/lib/schemas";
import { useRecaptcha } from "@/components/forms/useRecaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/**
 * Quote / contact form. Ported from contactus.php.
 *
 * All field NAMES are preserved so the shape reaching the server matches the
 * PHP exactly: name, email, phone, quote, boardingFrom, boardingTo, dogType,
 * dogAge, dogState, dogVaccinations, message, plus the fax_number honeypot.
 *
 * The Bootstrap chrome here has no shadcn equivalent and is hand-built:
 *  - `btn-check` radio groups rendered as joined segmented buttons (quote,
 *    dogState). Built on a real radio input so the form still posts natively.
 *  - `input-group` with a prepended icon addon and collapsed inner borders.
 *  - `.ios-switch` — 3em x 1.5em, off #e9ecef/#dee2e6, on #34c759.
 *
 * Behavior change worth noting: a failed submission now keeps everything the
 * visitor typed and shows per-field errors. The PHP redirected back with a
 * generic notice and discarded the entire message — including on legitimate
 * failures like an SMTP hiccup.
 */
function InputGroup({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <span className="flex items-center rounded-l-md border border-r-0 border-input bg-cream/40 px-3 text-espresso/70">
        {icon}
      </span>
      <div className="flex-1 [&_input]:rounded-l-none">{children}</div>
    </div>
  );
}

function PrefixGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <span className="flex shrink-0 items-center rounded-l-md border border-r-0 border-input bg-cream/40 px-3 text-sm text-espresso/70">
        {label}
      </span>
      <div className="flex-1 [&_input]:rounded-l-none">{children}</div>
    </div>
  );
}

/** Segmented radio group, replacing Bootstrap's btn-check + btn-group. */
function SegmentedRadio({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" className="inline-flex flex-wrap">
      {options.map((opt, i) => {
        const checked = value === opt.value;
        // The <input> is sr-only, so the <label> IS the tap target — min-h-11
        // puts it at the 44px minimum (it was 42px).
        return (
          <label
            key={opt.value}
            className={`flex min-h-11 cursor-pointer items-center justify-center border border-brand px-4 py-2 text-center transition-colors ${
              i === 0 ? "rounded-l-md" : "-ml-px"
            } ${i === options.length - 1 ? "rounded-r-md" : ""} ${
              checked
                ? "bg-brand text-white"
                : "bg-white text-brand hover:bg-brand/10"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 mb-0 text-sm text-cta">{message}</p>;
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContact, IDLE_STATE);
  const [pending, startTransition] = useTransition();
  const { getToken } = useRecaptcha("contact");

  const [quote, setQuote] = useState("daycare");
  const [dogState, setDogState] = useState<string | undefined>(undefined);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const token = await getToken();
    if (token) data.set("g-recaptcha-response", token);
    startTransition(() => formAction(data));
  }

  const errors = state.errors ?? {};

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="rounded-lg border border-brand/30 bg-sky/30 p-6"
      >
        <p className="mb-0 text-lg">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="overflow-hidden rounded-lg border border-brown/15 bg-white shadow-sm"
    >
      <div className="grid gap-6 p-5 md:grid-cols-2 xl:gap-8 xl:p-10">
        {/* Honeypot: hidden from sight and from assistive tech. */}
        <div className="hidden" aria-hidden>
          <label htmlFor="fax_number">Fax Number</label>
          <input type="text" name="fax_number" id="fax_number" tabIndex={-1} />
        </div>

        {state.status === "error" && state.message ? (
          <p
            role="alert"
            className="mb-0 rounded border border-cta/40 bg-cta/10 p-3 md:col-span-2"
          >
            {state.message}
          </p>
        ) : null}

        <div className="md:col-span-2">
          <Label htmlFor="name">
            Name <span className="text-cta">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            required
            aria-invalid={Boolean(errors.name) || undefined}
            className="mt-1"
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <Label htmlFor="email">
            Email <span className="text-cta">*</span>
          </Label>
          <div className="mt-1">
            <InputGroup icon={<Mail className="size-4" />}>
              <Input
                id="email"
                name="email"
                type="email"
                required
                aria-invalid={Boolean(errors.email) || undefined}
              />
            </InputGroup>
          </div>
          <FieldError message={errors.email} />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <div className="mt-1">
            <InputGroup icon={<Phone className="size-4" />}>
              <Input id="phone" name="phone" type="tel" />
            </InputGroup>
          </div>
        </div>

        <div className="rounded-lg border border-brown/15 p-4 md:col-span-2">
          <Label className="mb-2 block">Request a quote</Label>
          <SegmentedRadio
            name="quote"
            value={quote}
            onChange={setQuote}
            options={[
              { value: "daycare", label: "Daycare" },
              { value: "boarding", label: "Boarding" },
            ]}
          />

          {/* Revealed only for boarding, matching onQuoteChange() in the PHP. */}
          {quote === "boarding" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="boardingFrom">From</Label>
                <Input
                  id="boardingFrom"
                  name="boardingFrom"
                  type="date"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="boardingTo">To</Label>
                <Input
                  id="boardingTo"
                  name="boardingTo"
                  type="date"
                  className="mt-1"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <Label htmlFor="dogType">Dog</Label>
          <div className="mt-1">
            <PrefixGroup label="Type/breed">
              <Input id="dogType" name="dogType" />
            </PrefixGroup>
          </div>
        </div>

        <div>
          <Label htmlFor="dogAge" className="sr-only">
            Dog age
          </Label>
          <div className="mt-1 md:mt-[1.6rem]">
            <PrefixGroup label="Age">
              <Input id="dogAge" name="dogAge" />
            </PrefixGroup>
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Dog State</Label>
          <SegmentedRadio
            name="dogState"
            value={dogState}
            onChange={setDogState}
            options={[
              { value: "intact", label: "Intact" },
              { value: "neutered", label: "Neutered" },
            ]}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* .ios-switch: 3em x 1.5em, on-state #34c759 (iOS green). */}
          <Switch
            id="dogVaccinations"
            name="dogVaccinations"
            value="yes"
            className="h-6 w-12 data-[state=checked]:bg-[#34c759]"
          />
          <Label htmlFor="dogVaccinations" className="font-normal">
            Vaccines completed within a year (prepare to show documentation).
          </Label>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" rows={6} className="mt-1" />
        </div>

        <div className="md:col-span-2">
          <Button
            type="submit"
            disabled={pending}
            className="h-auto rounded-md px-6 py-2 text-lg"
          >
            {pending ? "Sending..." : "Submit"}
          </Button>
        </div>
      </div>
    </form>
  );
}
