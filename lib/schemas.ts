import { z } from "zod";

/**
 * Shared validation. Used by the server actions; the same shapes can drive
 * client-side hints without duplicating rules.
 *
 * The PHP had effectively no validation. Its entire defenses were:
 *   newsletter:    str_contains($email, 'serviseantilogin')
 *   lead-capture:  preg_match('/http/', $name)
 * Those are one hardcoded spammer and one heuristic, both trivially bypassed.
 * That mattered less when a submission cost a mail() call; post-migration each
 * one costs a serverless invocation plus a Resend send plus two HubSpot calls
 * plus a Blob write, so real validation is load-bearing.
 */

/** Substrings that mark a submission as spam. Seeded with the one string the
 * PHP hardcoded, but configurable so it can grow without a deploy. */
export function spamSubstrings(): string[] {
  const fromEnv = (process.env.SPAM_SUBSTRINGS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : ["serviseantilogin"];
}

export function looksLikeSpam(...values: (string | undefined | null)[]): boolean {
  const haystack = values.filter(Boolean).join(" ").toLowerCase();
  if (!haystack) return false;
  if (spamSubstrings().some((s) => haystack.includes(s))) return true;
  // Ported from contact-capture.php: a name containing a URL is never legitimate.
  return /https?:\/\/|www\./i.test(haystack);
}

const email = z
  .string()
  .trim()
  .min(1, "Please enter your email address.")
  .max(254)
  .email("Please enter a valid email address.");

const personName = z
  .string()
  .trim()
  .min(1, "Please enter your name.")
  .max(100, "That name is too long.");

/** Hidden field. Bots fill it; humans never see it. Must be empty. */
const honeypot = z
  .string()
  .max(0, "Rejected.")
  .optional()
  .or(z.literal(""));

export const newsletterSchema = z.object({
  email,
  fax_number: honeypot,
});

export const leadCaptureSchema = z.object({
  name: personName,
  email,
  fax_number: honeypot,
});

export const contactSchema = z.object({
  name: personName,
  email,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  quote: z.enum(["daycare", "boarding"]).default("daycare"),
  boardingFrom: z.string().trim().max(40).optional().or(z.literal("")),
  boardingTo: z.string().trim().max(40).optional().or(z.literal("")),
  dogType: z.string().trim().max(120).optional().or(z.literal("")),
  dogAge: z.string().trim().max(60).optional().or(z.literal("")),
  dogState: z.enum(["intact", "neutered"]).optional(),
  dogVaccinations: z.coerce.boolean().optional(),
  message: z.string().trim().max(5000).optional().or(z.literal("")),
  fax_number: honeypot,
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

/** Shape returned by every form action, consumed via useActionState. */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Field-level errors keyed by input name. */
  errors?: Record<string, string>;
};

export const IDLE_STATE: FormState = { status: "idle" };

/** Collapses a ZodError into the flat field->message map FormState wants. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
