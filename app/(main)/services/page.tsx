import type { Metadata } from "next";
import { Panel } from "@/components/layout/Panel";

/**
 * Ported from services.php — a genuine two-sentence stub.
 *
 * Deliberately excluded from the sitemap, matching today's behavior (it was
 * absent from sitemap.xml too). Not noindex'd, because that WOULD be a change
 * from current behavior; see plans/ for the note that flagged this as a
 * decision rather than a default.
 */
export const metadata: Metadata = {
  title: "Our Services",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <Panel title="Our Services">
      <p className="mb-0">
        We offer a variety of services for your pets. Contact us for more
        details.
      </p>
    </Panel>
  );
}
