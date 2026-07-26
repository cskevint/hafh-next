import type { Metadata } from "next";
import { Panel } from "@/components/layout/Panel";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  alternates: { canonical: "/contactus" },
};

/** Ported from contactus.php. Copy verbatim. */
export default function ContactUsPage() {
  return (
    <Panel title="Contact Us">
      <p className="text-xl leading-normal font-light text-brown">
        Have questions about our dog boarding services or ready to schedule your
        pet&apos;s stay? <b>We&apos;re here to help!</b>
      </p>
      <hr className="mx-auto mb-3 w-3/4 border-espresso/20 xl:mb-12" />
      <div className="lg:mx-auto lg:w-3/4">
        <ContactForm />
      </div>
    </Panel>
  );
}
