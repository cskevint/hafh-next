"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Panel } from "@/components/layout/Panel";
import { Button } from "@/components/ui/button";

/**
 * Ported from 500.php. Copy verbatim, except the title: 500.php set
 * pageTitle = "Not found", a copy-paste slip from 404.php.
 *
 * Note 500.php also returned HTTP 200. This boundary returns a real 500.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div data-surface="cream" className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <Panel title="500 Error!">
        <p>
          Something went wrong on our end. Please try again, or head back to the
          homepage.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={reset} className="h-auto px-6 py-2">
            Try again
          </Button>
          <Button asChild variant="secondary" className="h-auto px-6 py-2">
            <Link href="/">Go to the homepage</Link>
          </Button>
        </div>
      </Panel>
      <SiteFooter />
    </div>
  );
}
