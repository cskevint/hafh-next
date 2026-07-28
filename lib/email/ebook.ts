import { SITE, EBOOK, ebookDownloadUrl } from "@/content/site";
import { esc } from "./index";

/**
 * Visitor-facing e-book delivery email.
 *
 * Table-based layout with fully inline styles, on purpose: Outlook renders HTML
 * through Word's engine, which ignores flexbox, grid, and most <style> blocks.
 * Anything structural has to be a <table>, and anything visual has to be a
 * `style` attribute, or a meaningful share of recipients get an unstyled wall
 * of text.
 *
 * The brand faces (Gilroy/Lato) are web fonts. Mail clients largely refuse
 * @font-face, so this uses a system stack rather than shipping a font nobody
 * will load and silently falling back to Times.
 *
 * Ships a plain-text alternative too. HTML-only mail scores worse with spam
 * filters, and deliverability is the risk the migration plan called out as
 * highest for this whole flow.
 */

const BROWN = "#956230";
const CREAM = "#efd6ba";
const BONE = "#fcf7f3";
const ESPRESSO = "#230906";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const CONTENTS = [
  "Welcome to the best job on the planet",
  "Business operations and management",
  "Dog care and safety",
  "Setup and maintenance checklist",
  "Marketing and customer acquisition",
  "Finances, customer service, and compliance",
];

export const EBOOK_SUBJECT = `Your free e-book: ${EBOOK.title}`;

export function ebookEmailHtml(name: string): string {
  const firstName = esc(name.trim().split(/\s+/)[0] || "there");

  const contents = CONTENTS.map(
    (item) =>
      `<tr><td style="padding:0 0 8px 0;font:400 15px/1.5 ${FONT};color:${ESPRESSO};">
         <span style="color:${BROWN};font-weight:700;">&bull;</span>&nbsp;&nbsp;${esc(item)}
       </td></tr>`,
  ).join("");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(EBOOK_SUBJECT)}</title></head>
<body style="margin:0;padding:0;background-color:${CREAM};">
  <!-- Inbox preview line. Hidden in the body itself. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your copy of &ldquo;${esc(EBOOK.title)}&rdquo; is ready &mdash; ${EBOOK.pages} pages on starting an at-home dog boarding business.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${CREAM};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${BONE};border-radius:16px;">
          <tr>
            <td style="padding:32px 32px 0 32px;" align="center">
              <a href="${SITE.url}" style="text-decoration:none;">
                <img src="${SITE.url}/images/logo-horizontal.png" width="260" height="32" alt="${esc(SITE.name)}" style="display:block;border:0;width:260px;height:32px;">
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 0 32px;">
              <h1 style="margin:0;font:700 26px/1.25 ${FONT};color:${ESPRESSO};">Your free e-book is here</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 0 32px;">
              <p style="margin:0 0 14px 0;font:400 16px/1.6 ${FONT};color:${ESPRESSO};">Hi ${firstName},</p>
              <p style="margin:0 0 14px 0;font:400 16px/1.6 ${FONT};color:${ESPRESSO};">
                Thanks for grabbing a copy of <strong>${esc(EBOOK.title)}</strong> &mdash; ${EBOOK.pages} pages on turning a love of dogs into a business you run from home.
              </p>
            </td>
          </tr>

          <!-- Bulletproof-ish button: table + bgcolor so Outlook still paints it. -->
          <tr>
            <td style="padding:14px 32px 0 32px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="${BROWN}" style="border-radius:9999px;">
                    <a href="${EBOOK.url}" style="display:inline-block;padding:15px 38px;font:700 16px/1 ${FONT};color:#ffffff;text-decoration:none;border-radius:9999px;">
                      Read your e-book
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:14px 32px 0 32px;" align="center">
              <p style="margin:0;font:400 14px/1.5 ${FONT};color:${ESPRESSO};opacity:0.7;">
                Prefer to keep it? <a href="${ebookDownloadUrl}" style="color:${BROWN};">Download the PDF</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 0 32px;">
              <div style="border-top:1px solid rgba(35,9,6,0.12);"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 0 32px;">
              <p style="margin:0 0 14px 0;font:700 15px/1.4 ${FONT};color:${BROWN};text-transform:uppercase;letter-spacing:0.06em;">What&rsquo;s inside</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${contents}</table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 36px 32px;">
              <p style="margin:0;font:400 15px/1.6 ${FONT};color:${ESPRESSO};">
                Ready to go further? Our
                <a href="${SITE.url}/at-home-dog-boarding-course" style="color:${BROWN};font-weight:700;">online course</a>
                walks you through the whole setup, step by step.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="padding:20px 32px;" align="center">
              <p style="margin:0 0 6px 0;font:400 13px/1.5 ${FONT};color:${ESPRESSO};opacity:0.65;">
                You&rsquo;re getting this because you requested the free e-book at
                <a href="${SITE.url}" style="color:${BROWN};">houndawayfromhome.com</a>.
              </p>
              <p style="margin:0;font:400 13px/1.5 ${FONT};color:${ESPRESSO};opacity:0.65;">
                &copy; ${esc(SITE.legalName)} &middot; Questions? Just reply to this email.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function ebookEmailText(name: string): string {
  const firstName = name.trim().split(/\s+/)[0] || "there";
  return [
    `Hi ${firstName},`,
    "",
    `Thanks for grabbing a copy of "${EBOOK.title}" - ${EBOOK.pages} pages on turning a love of dogs into a business you run from home.`,
    "",
    `Read it here: ${EBOOK.url}`,
    `Or download the PDF: ${ebookDownloadUrl}`,
    "",
    "What's inside:",
    ...CONTENTS.map((item) => `  - ${item}`),
    "",
    `Ready to go further? Our online course walks you through the whole setup, step by step: ${SITE.url}/at-home-dog-boarding-course`,
    "",
    `You're getting this because you requested the free e-book at ${SITE.url}.`,
    `© ${SITE.legalName}. Questions? Just reply to this email.`,
  ].join("\n");
}
