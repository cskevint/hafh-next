import { Resend } from "resend";
import { SITE } from "@/content/site";

/**
 * Transactional email via Resend.
 *
 * Replaces PHPMailer over SMTP port 25 (includes/utility.php). Outbound port 25
 * is blocked on Vercel's serverless runtime, so porting that as-is would have
 * failed 100% in production — silently, since the PHP only reported a generic
 * error to the visitor.
 *
 * Parity note: the PHP set `to` = CONTACT_US_EMAIL and `replyTo` = the
 * submitter, so replying in the inbox goes to the customer. Resend's reply_to
 * gives that exactly.
 */
function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export type SendResult = { sent: boolean; error?: string };

/**
 * Sends to an explicit recipient.
 *
 * This is the VISITOR-facing path (e-book delivery). Owner notifications go
 * through sendNotification, which pins `to` to CONTACT_US_EMAIL so a caller
 * can't accidentally address one of those at a visitor.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative. HTML-only mail scores worse with spam filters,
   * and deliverability is the top risk flagged for these flows. */
  text?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set; would have sent: ${subject}`);
    return { sent: false, error: "not-configured" };
  }

  const from = process.env.MAIL_FROM;
  if (!from) {
    console.error("[email] MAIL_FROM missing");
    return { sent: false, error: "misconfigured" };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      ...(text ? { text } : {}),
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) {
      console.error("[email] Resend returned an error:", error);
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send threw:", err);
    return { sent: false, error: "exception" };
  }
}

export async function sendNotification({
  subject,
  html,
  replyTo,
}: {
  subject: string;
  html: string;
  replyTo?: { email: string; name?: string };
}): Promise<SendResult> {
  // Checked before the recipient so an unconfigured install still reports
  // "not-configured" rather than "misconfigured" — the README documents this.
  if (!emailConfigured()) {
    console.warn(`[email] RESEND_API_KEY not set; would have sent: ${subject}`);
    return { sent: false, error: "not-configured" };
  }

  const to = process.env.CONTACT_US_EMAIL;
  if (!to) {
    console.error("[email] CONTACT_US_EMAIL missing");
    return { sent: false, error: "misconfigured" };
  }

  return sendEmail({ to, subject, html, replyTo: replyTo?.email });
}

/** Minimal HTML escaping — every value below is visitor-supplied. */
export function esc(value: string | undefined | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Turns visitor newlines into <br>, after escaping. Replaces PHP's nl2br(). */
export function nl2br(value: string | undefined | null): string {
  return esc(value).replace(/\r?\n/g, "<br />");
}

export const MAIL_FOOTER = `<hr /><p style="font-size:12px;color:#666">Sent from ${esc(SITE.url)}</p>`;
