import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Layout for the main site: header, page, footer.
 *
 * `data-surface` drives the <html> background (see globals.css). The PHP set
 * `<html class="bg-info">` per page; a single root layout can't set per-group
 * html classes, so the group declares its surface and CSS `:has()` resolves it.
 * This only affects the iOS overscroll gutter, but it's visible.
 *
 * Note: no <FlashMessage /> here. The PHP's $_SESSION notice pattern is gone —
 * form feedback is returned by each Server Action to the form that submitted.
 * (The earlier attempt rendered FlashMessage in BOTH this layout and the
 * homepage, so the homepage showed every notice twice.)
 */
export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-surface="cream" className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
