import Link from "next/link";
import { BookOpen } from "lucide-react";
import { FOOTER_LINKS, SITE } from "@/content/site";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

/**
 * Site footer. A Server Component — only NewsletterForm ships JS.
 *
 * Ported from includes/footer.php, with two fixes:
 *  - The copyright linked to `#`, a dead anchor. It's now plain text.
 *  - Quick links pointed at `.php` URLs, which would each cost a 301. They now
 *    point at the canonical extensionless paths.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto bg-cream">
      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h5>{SITE.name}</h5>
          <p className="max-w-prose font-light">{SITE.blurb}</p>
          <p className="text-sm text-espresso/70">
            &copy; Copyrights. All rights reserved. {SITE.legalName}
          </p>
        </div>

        <nav className="lg:col-span-3" aria-label="Quick links">
          <h5>Quick links</h5>
          {/* `inline-block py-2.5` rather than `space-y-1` on the list: these
            * anchors were 20px tall, so the gap between them was dead space that
            * looked tappable and wasn't. Padding on the anchor turns that same
            * space into part of the target, reaching 44px without moving
            * anything visually. Standalone nav links get no relief from WCAG
            * 2.2 SC 2.5.8's inline-text exception — that only covers links sat
            * inside a sentence.
            *
            * `-mx-1 px-1` widens the box for the short labels ("FAQs" is only
            * 38px of text) while the negative margin keeps the text itself
            * flush with the heading above. Left as `inline-block` rather than
            * `block` on purpose: a full-width anchor would make the empty space
            * out to the column edge navigate too. */}
          <ul>
            {FOOTER_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="-mx-1 inline-block px-1 py-2.5 text-espresso underline-offset-4 hover:text-brand hover:underline"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h5>Newsletter</h5>
          <p className="mb-0 font-light">Join our newsletter!</p>
          <NewsletterForm />
          <p className="mt-3 text-sm">
            Or{" "}
            <Link
              href="/download-free-ebook"
              className="text-brown underline underline-offset-4 hover:text-brand"
            >
              download our free ebook!
            </Link>{" "}
            <BookOpen className="inline size-4" aria-hidden />
          </p>
        </div>
      </div>
    </footer>
  );
}
