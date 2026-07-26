import { LegalFooter } from "@/components/layout/LegalFooter";

/**
 * Funnel pages: logo band, content, legal disclaimer. NO site nav — these are
 * standalone landing pages and the PHP deliberately excluded the nav so there's
 * no escape route from the funnel.
 *
 * The header is NOT rendered here: each page supplies its own <LandingHeader>
 * so the quiz can vary logo size and tagline per step.
 *
 * data-surface="brown" reproduces `<html class="bg-secondary">` on these pages
 * (see globals.css).
 */
export default function LandingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-surface="brown" className="flex min-h-full flex-1 flex-col">
      {children}
      <LegalFooter />
    </div>
  );
}
