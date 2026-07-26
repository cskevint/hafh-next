import type { Metadata } from "next";
import Link from "next/link";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LeadCaptureForm } from "@/components/forms/LeadCaptureForm";
import { captureGuideLead } from "@/lib/actions/lead-capture";

const DESCRIPTION =
  "Learn all about the at-home dog-boarding and doggy daycare business and how you can get started in just 9 days!";

export const metadata: Metadata = {
  title: "Watch an Introductory Guide",
  description: DESCRIPTION,
  alternates: { canonical: "/watch-introductory-guide" },
  openGraph: {
    title: "Watch an Introductory Guide",
    description: DESCRIPTION,
    images: [{ url: "/images/share/guide.jpg", width: 1200, height: 630 }],
  },
};

/** Ported from watch-introductory-guide.php. Copy verbatim. */
export default function WatchIntroductoryGuidePage() {
  return (
    <>
      <LandingHeader />
      <section className="bg-bone">
        <main className="container mx-auto p-6 lg:p-12">
          <h1 className="text-center md:px-8 lg:px-20">
            Learn all about the at-home dog-boarding and doggy daycare business
          </h1>
          <h3 className="py-2 text-center text-espresso/60">
            and how you can get started with your own business in just 9 days!
          </h3>
          <h3 className="py-2 text-center text-brand">
            Work from home, cuddle dogs, and make money!
          </h3>
          <hr className="m-6 border-espresso/15 lg:m-12" />
          <h4 className="py-2 text-center text-brown">
            Access our free getting started video now:
          </h4>
          <div className="mb-12 md:mx-auto md:w-1/2">
            <LeadCaptureForm
              action={captureGuideLead}
              submitLabel="Take me to the introductory guide!"
            />
          </div>
          <p className="my-3 mb-0 text-center">
            <Link
              href="/at-home-dog-boarding-course"
              className="text-brown underline-offset-4 hover:underline"
            >
              Learn more about our online course!
            </Link>
          </p>
        </main>
      </section>
    </>
  );
}
