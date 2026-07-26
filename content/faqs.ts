/**
 * The 11 site FAQs, previously faqs.md rendered through Parsedown Extra.
 *
 * Moved to typed data rather than kept as markdown, because faqs.md used two
 * Parsedown-SPECIFIC features that react-markdown + remark-gfm silently mangle:
 *
 *   1. Attribute blocks — `### What are your rates? {.mt-4}`. Unsupported, so
 *      the literal string "{.mt-4}" renders inside all eleven headings.
 *   2. Raw inline HTML — `<a href="/contactus.php" class="text-secondary">`.
 *      Escaped without rehype-raw, so it renders as visible HTML source.
 *
 * The earlier migration attempt shipped exactly those two bugs. Structured data
 * also lets the page emit FAQPage JSON-LD, a rich-results opportunity this page
 * has never had.
 */

export type FaqBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: readonly string[] }
  /** A link to /contactus, optionally followed by more prose. The source
   * markdown pointed at /contactus.php, which would now cost a 301. */
  | { kind: "contactLink"; text: string; after?: string };

export type Faq = {
  question: string;
  blocks: readonly FaqBlock[];
};

export const FAQS: readonly Faq[] = [
  {
    question: "What services do you offer?",
    blocks: [
      {
        kind: "p",
        text: "We provide overnight boarding, daycare options, long-term stays, and special accommodations like medication administration or care for senior dogs. We can also do bathing and provide home-cooked healthy meals for your dog as well.",
      },
      {
        kind: "p",
        text: "Our family environment is well-suited to the mental wellness of your pet to provide a home for your dog while you’re away, as well as you mental ease knowing your dog is well taken care of.",
      },
    ],
  },
  {
    question: "What are your rates?",
    blocks: [{ kind: "contactLink", text: "Contact us!" }],
  },
  {
    question: "What vaccinations are required for my dog to stay with you?",
    blocks: [
      { kind: "p", text: "Our mandatory vaccinations are:" },
      { kind: "list", items: ["rabies", "distemper", "Bordetella"] },
      {
        kind: "p",
        text: "Flea/tick prevention and heartworm prevention is also a requirement. Flu vaccines may not be required in all instances.",
      },
    ],
  },
  {
    question:
      "What is the typical daily schedule for a dog staying at your facility?",
    blocks: [
      {
        kind: "p",
        text: "While not all days are the same, here is a typical day schedule - though times can vary.",
      },
      {
        kind: "list",
        items: [
          "Breakfast before 7am and before new dogs start arriving.",
          "Playtime 8-9am",
          "Rest 9-11am",
          "Playtime 11-12pm",
          "Rest 12-2pm",
          "Play from 2-3pm",
        ],
      },
      {
        kind: "p",
        text: "When our kids come home from school around 3pm, the dogs spend a lot of time snuggling and resting, waiting to be picked up from their daycares.",
      },
    ],
  },
  {
    question: "How do you handle emergencies?",
    blocks: [
      {
        kind: "p",
        text: "If the emergency requires medical care, we would take the dog to the vet immediately. Close by, there are several 24-hour emergency vets within a 3-minute car ride. We then call the owner to let them know the circumstances. If there is some sort of other emergency, a call to the owners would happen first.",
      },
    ],
  },
  {
    question: "What do I need to bring with my dog for their stay?",
    blocks: [
      {
        kind: "p",
        text: "You only need to bring the food and treats labeled with their name and instructions for each meal -- no beds, bowls or toys are necessary.",
      },
    ],
  },
  {
    question: "How do you handle dogs with special needs or behavior issues?",
    blocks: [
      {
        kind: "p",
        text: "Each dog at our home receives individualized attention and care. Whether it’s a massage daily, extra cuddles, individual feeding time, or giving them their medicine.",
      },
    ],
  },
  {
    question: "What is your cancellation policy?",
    blocks: [
      {
        kind: "p",
        text: "We have a flexible cancellation policy: there is no fee if at least a 24-hour notice is given.",
      },
      {
        kind: "p",
        text: "For the Thanksgiving break and end of year holidays, including Christmas and New Years, a three-day notice is required.",
      },
    ],
  },
  {
    question: "How do I book a stay for my dog?",
    blocks: [
      {
        kind: "contactLink",
        text: "Contact us",
        after:
          " for an initial meet-n-greet. From then on, we are flexible on booking, and can often receive same day requests -- just text us!",
      },
    ],
  },
  {
    question: "What happens if there is a medical issue?",
    blocks: [
      {
        kind: "p",
        text: "If there is any issue with your dogs in our care, you have a money-back guarantee for the stay as well as payment for other issues.",
      },
    ],
  },
  {
    question: "How do I pay?",
    blocks: [{ kind: "p", text: "We accept Zelle, cash or check." }],
  },
];

/** Flattens an answer to plain text for FAQPage JSON-LD. */
export function faqAnswerText(faq: Faq): string {
  return faq.blocks
    .map((b) => {
      if (b.kind === "p") return b.text;
      if (b.kind === "list") return b.items.join(", ");
      return `${b.text}${b.after ?? ""}`;
    })
    .join(" ")
    .trim();
}
