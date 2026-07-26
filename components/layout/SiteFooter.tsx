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
          <ul className="space-y-1">
            {FOOTER_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-espresso underline-offset-4 hover:text-brand hover:underline"
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
