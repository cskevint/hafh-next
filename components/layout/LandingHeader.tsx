import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/content/site";

/**
 * Logo band for the standalone funnel pages (ebook, guide, video, quiz).
 *
 * Size is a prop, not fixed: is-dog-boarding-right-for-me.php shows a 200px
 * logo plus a tagline on question 0, then a 100px logo with no tagline for the
 * rest of the quiz. The earlier migration attempt hardcoded 200px in the shared
 * layout, which cannot express that.
 */
export function LandingHeader({
  size = "large",
  tagline,
}: {
  size?: "large" | "small";
  tagline?: string;
}) {
  const maxHeight = size === "large" ? 200 : 100;

  return (
    <section className="bg-brand">
      <div className="container mx-auto flex flex-col items-center gap-3 p-2">
        <Link href="/">
          <Image
            src="/images/logo-transparent.png"
            alt={SITE.name}
            width={1141}
            height={1141}
            priority
            style={{ maxHeight, width: "auto" }}
            className="h-auto"
          />
        </Link>
        {tagline ? (
          <h2 className="mb-2 text-center text-white">{tagline}</h2>
        ) : null}
      </div>
    </section>
  );
}
