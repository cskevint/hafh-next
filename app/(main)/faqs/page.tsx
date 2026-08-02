import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/layout/Panel";
import { FAQS, faqAnswerText, type FaqBlock } from "@/content/faqs";

export const metadata: Metadata = {
  title: "FAQs",
  alternates: { canonical: "/faqs" },
};

/**
 * Ported from faqs.php, which rendered faqs.md through Parsedown Extra on every
 * request. Same flat h3 + prose layout — no restructuring into an accordion.
 *
 * Adds FAQPage JSON-LD, which this page has never had despite being eleven
 * clean Q&A pairs.
 */
function Block({ block }: { block: FaqBlock }) {
  if (block.kind === "list") {
    return (
      <ul className="list-disc pl-8">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.kind === "contactLink") {
    /* With no `after`, this link IS the entire answer ("What are your rates?" →
     * "Contact us!"), so it is a standalone target and needs the full 44px —
     * WCAG 2.2 SC 2.5.8's inline-text exception only covers a link sitting
     * inside a sentence. When `after` is present it is genuinely mid-sentence,
     * and padding it out would wreck the line spacing the exception exists to
     * protect. */
    const standalone = !block.after;
    return (
      <p>
        <Link
          href="/contactus"
          className={`text-brown underline underline-offset-4 hover:text-brand ${
            standalone ? "-mx-1 inline-block px-1 py-2.5" : ""
          }`}
        >
          {block.text}
        </Link>
        {block.after}
      </p>
    );
  }
  return <p>{block.text}</p>;
}

export default function FaqsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faqAnswerText(faq) },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Serialized from typed data we author, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Panel title="Frequently Asked Questions">
        {FAQS.map((faq) => (
          <section key={faq.question} className="mt-6">
            <h3>{faq.question}</h3>
            {faq.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </section>
        ))}
      </Panel>
    </>
  );
}
