"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { redirect } from "next/navigation";
import {
  fieldErrors,
  leadCaptureSchema,
  looksLikeSpam,
  type FormState,
} from "@/lib/schemas";
import { storeLead, type LeadKind } from "@/lib/leads/store";
import { esc, sendEmail, sendNotification, MAIL_FOOTER } from "@/lib/email";
import {
  EBOOK_SUBJECT,
  ebookEmailHtml,
  ebookEmailText,
} from "@/lib/email/ebook";
import { upsertContact } from "@/lib/hubspot";

/**
 * Shared lead capture for the ebook, guide and quiz funnels.
 * Replaces contact-capture.php?redirect=ebook|guide|quiz.
 *
 * Flow differences from the PHP:
 *  - ebook and guide END in a navigation, so those use redirect(). The quiz does
 *    NOT: it reveals its result panel in place, which is also what closes the
 *    ?question=DONE gate bypass (see components/quiz).
 *  - The PHP sent visitors to /500 on bad input, and /500 wasn't a route in the
 *    earlier migration attempt. Errors now return FormState instead.
 *  - HubSpot runs in after() so a slow CRM call never delays the response.
 *
 * The ebook funnel now DELIVERS. The PHP (and the first pass of this port) only
 * notified the owner while the button said "Send me the PDF!", so the visitor
 * got nothing. The PDF lives in a standalone public Blob store and the link is
 * emailed below; see DELIVERABLES.
 */
type Funnel = Extract<LeadKind, "ebook" | "guide" | "quiz">;

const SUBJECTS: Record<Funnel, string> = {
  ebook: "[HAFH] E-book Request",
  guide: "[HAFH] Guide Request",
  quiz: "[HAFH] Quiz Completion",
};

/**
 * Visitor-facing follow-up, per funnel. Keyed rather than special-cased on
 * `funnel === "ebook"` so the guide and quiz can be filled in later without
 * restructuring; a funnel with no entry simply sends nothing, which is the
 * current behavior for those two.
 */
const DELIVERABLES: Partial<
  Record<Funnel, (name: string) => { subject: string; html: string; text: string }>
> = {
  ebook: (name) => ({
    subject: EBOOK_SUBJECT,
    html: ebookEmailHtml(name),
    text: ebookEmailText(name),
  }),
};

export async function captureLead(
  funnel: Funnel,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = leadCaptureSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    fax_number: formData.get("fax_number") ?? "",
  });

  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    if (errors.fax_number) return { status: "success" };
    return {
      status: "error",
      errors,
      message: "Please check the highlighted fields and try again.",
    };
  }

  const { name, email } = parsed.data;

  // Ported from contact-capture.php: a name containing a URL is never real.
  if (looksLikeSpam(name)) {
    return { status: "error", message: "An error has occurred." };
  }

  const h = await headers();
  await storeLead({
    kind: funnel,
    receivedAt: new Date().toISOString(),
    email,
    name,
    meta: {
      ip: h.get("x-real-ip") ?? h.get("x-forwarded-for") ?? undefined,
      userAgent: h.get("user-agent") ?? undefined,
      referer: h.get("referer") ?? undefined,
    },
  });

  // Don't make the visitor wait on HubSpot or either email.
  after(async () => {
    await upsertContact(email, name);

    // Deliver to the visitor FIRST — that's the one they're waiting on, and
    // the owner notification must not be able to starve it.
    const deliverable = DELIVERABLES[funnel]?.(name);
    if (deliverable) {
      const result = await sendEmail({
        to: email,
        subject: deliverable.subject,
        html: deliverable.html,
        text: deliverable.text,
        replyTo: process.env.CONTACT_US_EMAIL,
      });
      if (!result.sent) {
        // The lead is already persisted, so this is recoverable by hand off
        // the owner notification below.
        console.error(
          `[lead-capture] ${funnel} delivery to visitor failed: ${result.error}`,
        );
      }
    }

    await sendNotification({
      subject: SUBJECTS[funnel],
      html: `<h2>${esc(SUBJECTS[funnel])}</h2>
             <p><strong>Name:</strong> ${esc(name)}<br />
                <strong>Email:</strong> ${esc(email)}</p>
             ${MAIL_FOOTER}`,
      replyTo: { email, name },
    });
  });

  // ebook and guide end in a navigation; quiz reveals its result in place.
  if (funnel === "ebook") redirect("/at-home-dog-boarding-course");
  if (funnel === "guide") redirect("/introductory-guide-video");

  return { status: "success" };
}

/** Bound variants, so client components can pass these straight to
 * useActionState without needing to close over the funnel name. */
export async function captureEbookLead(prev: FormState, formData: FormData) {
  return captureLead("ebook", prev, formData);
}
export async function captureGuideLead(prev: FormState, formData: FormData) {
  return captureLead("guide", prev, formData);
}
export async function captureQuizLead(prev: FormState, formData: FormData) {
  return captureLead("quiz", prev, formData);
}
