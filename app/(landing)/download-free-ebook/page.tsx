import type { Metadata } from "next";
import Link from "next/link";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LeadCaptureForm } from "@/components/forms/LeadCaptureForm";
import { captureEbookLead } from "@/lib/actions/lead-capture";

const DESCRIPTION =
  "Learn the basics of setting up your own at-home dog-boarding business by getting your own free copy of our e-book!";

export const metadata: Metadata = {
  title: "Download our Free E-book",
  description: DESCRIPTION,
  alternates: { canonical: "/download-free-ebook" },
  openGraph: {
    title: "Download our Free E-book",
    description: DESCRIPTION,
    images: [{ url: "/images/share/ebook.jpg", width: 1200, height: 630 }],
  },
};

/** Ported from download-free-ebook.php. Copy verbatim. */
export default function DownloadFreeEbookPage() {
  return (
    <>
      <LandingHeader />
      <section className="bg-bone">
        <main className="container mx-auto p-6 text-center lg:p-12">
          <h1 className="md:px-8 lg:px-20">
            Learn the basics of setting up your own at-home dog-boarding business
          </h1>
          <h3 className="py-2 text-espresso/60">
            by getting your own free copy of our e-book!
          </h3>
          <hr className="m-6 border-espresso/15 lg:m-12" />
          <div className="mb-12 md:mx-auto md:w-1/2">
            <LeadCaptureForm
              action={captureEbookLead}
              submitLabel="Send me the PDF!"
            />
          </div>
          <p className="my-3 mb-0">
            <Link
              href="/at-home-dog-boarding-course"
              className="text-brown underline-offset-4 hover:underline"
            >
              Learn about our online course!
            </Link>
          </p>
        </main>
      </section>
    </>
  );
}
