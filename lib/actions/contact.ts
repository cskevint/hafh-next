"use server";

import { headers } from "next/headers";
import {
  contactSchema,
  fieldErrors,
  looksLikeSpam,
  type FormState,
} from "@/lib/schemas";
import { storeLead } from "@/lib/leads/store";
import { esc, nl2br, sendNotification, MAIL_FOOTER } from "@/lib/email";
import { verifyCaptcha } from "@/lib/recaptcha";
import { SITE } from "@/content/site";

/**
 * Contact / quote request. Replaces contactus-mail.php.
 *
 * THE IMPORTANT CHANGE: the submission is PERSISTED BEFORE the email is
 * attempted, and an email failure no longer loses the lead.
 *
 * contactus-mail.php only emailed. If SMTP hiccuped, the enquiry was gone
 * forever and the visitor was told to email selena@ manually. This is the
 * booking funnel for a real business, and we're simultaneously switching email
 * providers, so a delivery failure has to be recoverable rather than fatal.
 *
 * Also: the PHP dropped everything the visitor typed on any failure. Returning
 * FormState preserves their input.
 */
export async function submitContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = {
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    quote: (formData.get("quote") as string) || "daycare",
    boardingFrom: formData.get("boardingFrom") ?? "",
    boardingTo: formData.get("boardingTo") ?? "",
    dogType: formData.get("dogType") ?? "",
    dogAge: formData.get("dogAge") ?? "",
    dogState: (formData.get("dogState") as string) || undefined,
    dogVaccinations: formData.get("dogVaccinations") === "yes",
    message: formData.get("message") ?? "",
    fax_number: formData.get("fax_number") ?? "",
  };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    if (errors.fax_number) {
      // Honeypot filled: a bot. Report success so it learns nothing.
      return { status: "success", message: "Successfully sent your note." };
    }
    return {
      status: "error",
      errors,
      message: "Please check the highlighted fields and try again.",
    };
  }

  const data = parsed.data;

  if (looksLikeSpam(data.name, data.message)) {
    return { status: "error", message: "An error has occurred." };
  }

  const disallowed = (process.env.EMAIL_DISALLOW_LIST || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (disallowed.includes(data.email.toLowerCase())) {
    // Matches the PHP: a generic error, revealing nothing about the blocklist.
    return { status: "error", message: "An error has occurred." };
  }

  const captcha = await verifyCaptcha(
    formData.get("g-recaptcha-response") as string | null,
    "contact",
  );
  if (!captcha.ok) {
    return {
      status: "error",
      message:
        "We couldn't verify that you're human. Please reload the page and try again.",
    };
  }

  const h = await headers();

  // Persist FIRST, so the lead survives an email failure.
  await storeLead({
    kind: "contact",
    receivedAt: new Date().toISOString(),
    email: data.email,
    name: data.name,
    fields: {
      phone: data.phone || null,
      quote: data.quote,
      boardingFrom: data.boardingFrom || null,
      boardingTo: data.boardingTo || null,
      dogType: data.dogType || null,
      dogAge: data.dogAge || null,
      dogState: data.dogState ?? null,
      dogVaccinations: Boolean(data.dogVaccinations),
      message: data.message || null,
    },
    meta: {
      ip: h.get("x-real-ip") ?? h.get("x-forwarded-for") ?? undefined,
      userAgent: h.get("user-agent") ?? undefined,
      referer: h.get("referer") ?? undefined,
    },
  });

  const quoteBlock =
    data.quote === "boarding"
      ? `<p><strong>Quote requested:</strong> Boarding<br />
           From: ${esc(data.boardingFrom)}<br />
           To: ${esc(data.boardingTo)}</p>`
      : `<p><strong>Quote requested:</strong> Daycare</p>`;

  const html = `
    <h2>Contact Us — ${esc(data.name)}</h2>
    <p><strong>Email:</strong> ${esc(data.email)}<br />
       <strong>Phone:</strong> ${esc(data.phone) || "—"}</p>
    ${quoteBlock}
    <p><strong>Dog:</strong> ${esc(data.dogType) || "—"},
       age ${esc(data.dogAge) || "—"}, ${esc(data.dogState) || "—"}</p>
    <p><strong>Vaccinations confirmed within the last year:</strong> ${
      data.dogVaccinations ? "Yes" : "No"
    }</p>
    <p><strong>Message:</strong><br />${nl2br(data.message)}</p>
    ${MAIL_FOOTER}
  `;

  const mail = await sendNotification({
    subject: `[HAFH] Contact Us - from ${data.name}`,
    html,
    replyTo: { email: data.email, name: data.name },
  });

  if (!mail.sent) {
    // The record is already stored, so this is recoverable. Still tell the
    // visitor how to reach a human directly.
    console.error("[contact] stored but not emailed:", data.email);
    return {
      status: "success",
      message: `Thanks — we've got your request. If you don't hear back within a day, email us at ${SITE.publicEmail}.`,
    };
  }

  return { status: "success", message: "Successfully sent your note." };
}
