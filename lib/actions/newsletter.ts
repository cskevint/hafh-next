"use server";

import { headers } from "next/headers";
import {
  fieldErrors,
  looksLikeSpam,
  newsletterSchema,
  type FormState,
} from "@/lib/schemas";
import { storeLead } from "@/lib/leads/store";

/**
 * Footer newsletter signup.
 *
 * Replaces newsletter-capture.php, which had three problems worth naming:
 *   - It appended to $NEWSLETTER_CSV, which was the empty string in config, so
 *     `file_put_contents('')` failed silently on every signup.
 *   - It told the user "Your email address has been added." regardless.
 *   - Its only spam defense was one hardcoded substring.
 *
 * A Server Action rather than a route handler specifically so SiteFooter can
 * stay a Server Component — the earlier attempt marked the entire footer
 * "use client" for one <input>, and shipped that on every page.
 */
export async function subscribeToNewsletter(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email") ?? "",
    fax_number: formData.get("fax_number") ?? "",
  });

  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    // A filled honeypot is a bot. Return the generic success message rather
    // than an error so it learns nothing about why it failed.
    if (errors.fax_number) {
      return {
        status: "success",
        message: "Your email address has been added.",
      };
    }
    return { status: "error", errors, message: errors.email };
  }

  const { email } = parsed.data;

  if (looksLikeSpam(email)) {
    return { status: "error", message: "An error has occurred." };
  }

  const h = await headers();
  await storeLead({
    kind: "newsletter",
    receivedAt: new Date().toISOString(),
    email,
    meta: {
      ip: h.get("x-real-ip") ?? h.get("x-forwarded-for") ?? undefined,
      userAgent: h.get("user-agent") ?? undefined,
      referer: h.get("referer") ?? undefined,
    },
  });

  // Storage failures are logged, not surfaced: a lost newsletter record is
  // preferable to showing an error to someone who did nothing wrong.
  return { status: "success", message: "Your email address has been added." };
}
