import type { Metadata } from "next";
import Link from "next/link";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { VimeoPlayer } from "@/components/media/VimeoPlayer";
import { Button } from "@/components/ui/button";

const DESCRIPTION =
  "Welcome to our introductory guide about your at-home dog-boarding business!";

/**
 * The gated thank-you page reached after the guide form.
 *
 * noindex is declared HERE in metadata, not via robots.txt. The PHP did both,
 * which is self-defeating: robots.txt Disallowed the path, so Google could never
 * crawl the page to discover the noindex, and the bare URL could still surface
 * in results. app/robots.ts drops the Disallow accordingly.
 */
export const metadata: Metadata = {
  title: "Watch an Introductory Guide",
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    title: "Watch an Introductory Guide",
    description: DESCRIPTION,
    images: [{ url: "/images/share/guide.jpg", width: 1200, height: 630 }],
  },
};

export default function IntroductoryGuideVideoPage() {
  return (
    <>
      <LandingHeader />
      <section className="bg-bone">
        <main className="container mx-auto p-6 lg:p-12">
          <h1 className="mb-6 text-center">
            Welcome to our introductory guide!
          </h1>
          <div className="lg:mx-auto lg:w-4/5">
            <VimeoPlayer />
          </div>
          <div className="mt-10 text-center">
            <Button asChild className="h-auto rounded-full px-6 py-2 text-xl">
              <Link href="/at-home-dog-boarding-course">
                Enroll in our course now!
              </Link>
            </Button>
          </div>
        </main>
      </section>
    </>
  );
}
