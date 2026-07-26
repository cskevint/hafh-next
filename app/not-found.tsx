import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Panel } from "@/components/layout/Panel";
import { Button } from "@/components/ui/button";

/**
 * Ported from 404.php. Copy verbatim.
 *
 * Renders its own header/footer because app/not-found.tsx sits outside the
 * (main) route group and so does not inherit its layout.
 */
export default function NotFound() {
  return (
    <div data-surface="cream" className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <Panel title="Webpage not found!">
        <Button asChild variant="secondary" className="h-auto px-6 py-2">
          <Link href="/">Go to the homepage</Link>
        </Button>
      </Panel>
      <SiteFooter />
    </div>
  );
}
