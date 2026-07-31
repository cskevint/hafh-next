import type { Metadata } from "next";
import Image from "next/image";
import { enrollUrl } from "@/content/site";
import {
  audience,
  coach,
  disclaimers,
  faqIcon,
  faqs,
  infoboxes,
  learn,
  outline,
  testimonials,
} from "@/content/course";
import { CourseOutline } from "@/components/course/CourseOutline";
import { CourseVideo } from "@/components/course/CourseVideo";
import { EnrollButton } from "@/components/course/EnrollButton";
import { ReadMore } from "@/components/course/ReadMore";
import { LoopingVideo } from "@/components/media/LoopingVideo";
import { SectionTracker } from "@/components/analytics/SectionTracker";

const DESCRIPTION =
  "Turn your love for dogs into a profitable, flexible career -- enroll on our online course today!";

export const metadata: Metadata = {
  title: "At-home Dog Boarding Course",
  description: DESCRIPTION,
  alternates: { canonical: "/at-home-dog-boarding-course" },
  openGraph: {
    title: "At-home Dog Boarding Course",
    description: DESCRIPTION,
    images: [{ url: "/images/share/course.jpg", width: 1200, height: 630 }],
  },
};

/** Media for the three "what you'll learn" rows, in DOM order. */
const LEARN_MEDIA = [
  "/images/course/learn_success",
  "/images/course/learn_business",
  "/images/course/learn_situations",
] as const;

/**
 * Course sales page — the largest page on the site (825 lines of PHP).
 *
 * Copy comes from content/course/generated.ts, scraped from the live DOM. See
 * that file for why the rendered DOM was the source rather than the PHP (three
 * malformed-HTML regions the browser silently repairs, plus ~10
 * heredoc-interpolated arrays).
 *
 * Section ids moved from the HEADINGS onto the <section> wrappers. In the PHP
 * they sat on h1/h2/h3, which coupled the anchor targets to the heading
 * hierarchy AND to the fbq tracker. Both are now independent — see
 * SectionTracker for why that matters for event parity.
 *
 * #comingSoonModal is deliberately NOT ported: its only occurrence in the whole
 * tree is its own definition. Nothing targets it.
 */
export default async function CourseePage(props: {
  // Async in Next 16 — synchronous searchParams access was removed.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const rawOffer = searchParams.offer;
  const offer = Array.isArray(rawOffer) ? rawOffer[0] : rawOffer;
  // Allowlisted in content/site.ts — the PHP interpolated $_REQUEST['offer']
  // straight into the Kajabi URL, so anyone could change what the page sold.
  const href = enrollUrl(offer);

  return (
    <>
      <main>
        {/* Hero */}
        <section
          className="px-4 py-12"
          style={{
            background:
              "linear-gradient(180deg, #FFFBF9 16.31%, #FFE6D2 89.83%)",
          }}
        >
          <div className="container mx-auto grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl leading-tight md:text-5xl">
                Turn your love for dogs into a{" "}
                <span className="text-tan">profitable</span>, flexible career!
              </h1>
              <p className="my-6 text-xl leading-normal">
                Ready to turn your love for dogs into a thriving business? Our
                online course will tell you everything you need to know to run
                your own at-home dog boarding business!
              </p>
              <EnrollButton href={href} location="header">
                Enroll Now
              </EnrollButton>
            </div>
            <CourseVideo />
          </div>
        </section>

        {/* Pre-launch sale */}
        <section className="bg-white px-4 py-12">
          <div className="container mx-auto grid items-center gap-8 lg:grid-cols-12">
            <div className="hidden lg:col-span-5 lg:block">
              <Image
                src="/images/course/frenchbulldog.png"
                alt=""
                width={503}
                height={317}
                className="h-auto w-full"
              />
            </div>
            <div className="rounded-2xl bg-brown p-6 text-white shadow-lg lg:col-span-7">
              <h2 className="text-white">Pre-launch Sale!</h2>
              <p className="text-xl">
                <b>First 10 purchases</b> get a 45-min coaching call!
              </p>
              <p className="text-xl">85% Off Lifetime Access</p>
              <p className="text-xl">Early Access to the Course</p>
              <p className="mb-6 text-xl">
                Daily Answers
                <span className="font-light"> to Your Questions</span>
              </p>
              <EnrollButton href={href} location="discount">
                Grab Your Discount!
              </EnrollButton>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <SectionTracker name="testimonials">
          <section
            id="testimonials"
            className="scroll-mt-20 px-4 py-16"
            style={{
              background:
                "linear-gradient(140.37deg, #069EE0 24.28%, #0279AD 103.59%)",
            }}
          >
            <div className="container mx-auto">
              <h2 className="mb-10 text-center text-white">Testimonials</h2>
              <div className="grid gap-6 lg:grid-cols-3">
                {testimonials.map((t) => (
                  <figure
                    key={t.name}
                    className="flex flex-col rounded-2xl bg-white p-6"
                  >
                    <Image
                      src="/images/course/quote.png"
                      alt=""
                      width={41}
                      height={35}
                      className="mb-3 h-auto w-10"
                    />
                    <blockquote className="grow italic">
                      {t.quote}
                      {"more" in t && t.more ? <ReadMore more={t.more} /> : null}
                    </blockquote>
                    <figcaption className="mt-4 flex items-center gap-3">
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        width={50}
                        height={50}
                        className="size-12 rounded-full object-cover"
                      />
                      <span>
                        <span className="block text-lg">{t.name}</span>
                        <span className="block text-brand">{t.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div className="mt-10 text-center">
                <EnrollButton href={href} location="testimonials">
                  Enroll &amp; Learn Today
                </EnrollButton>
              </div>
            </div>
          </section>
        </SectionTracker>

        {/* Why choose dog boarding */}
        <section id="why-choose" className="scroll-mt-20 bg-white px-4 py-16">
          <div className="container mx-auto">
            <h2 className="mb-3 text-center text-ink">
              Why Choose Dog Boarding?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-center">
              Dog boarding offers a flexible, fulfilling opportunity to earn
              income while providing care and companionship to adorable dogs.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {infoboxes.map((box) => (
                <div
                  key={box.image}
                  className="infobox flex flex-col items-center rounded-[2rem] p-6 text-center"
                >
                  <Image
                    src={`/images/course/box_${box.image}.png`}
                    alt=""
                    width={97}
                    height={96}
                    className="mb-3 h-auto w-20"
                  />
                  <h3 className="mb-0 text-xl">{box.text}</h3>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <EnrollButton href={href} location="why-choose">
                Unlock Your Course
              </EnrollButton>
            </div>
          </div>
        </section>

        {/* What you'll learn */}
        <SectionTracker name="learn">
          <section id="learn" className="scroll-mt-20 bg-bone px-4 py-16">
            <div className="container mx-auto">
              <h2 className="mb-12 text-center">
                What you&apos;ll learn in this course
              </h2>
              <div className="space-y-14">
                {learn.map((row, i) => (
                  <div
                    key={row.title}
                    className="grid items-center gap-8 lg:grid-cols-2"
                  >
                    <LoopingVideo
                      src={LEARN_MEDIA[i] ?? LEARN_MEDIA[0]!}
                      poster={`${LEARN_MEDIA[i] ?? LEARN_MEDIA[0]!}-poster.jpg`}
                      alt={row.title}
                      className={`w-full rounded-xl ${i % 2 === 1 ? "lg:order-2" : ""}`}
                    />
                    <div>
                      <h3 className="mb-4">{row.title}</h3>
                      <ul className="checkmark-list space-y-3 pl-10">
                        {row.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 text-center">
                <EnrollButton href={href} location="learn">
                  Enroll &amp; Learn Today
                </EnrollButton>
              </div>
            </div>
          </section>
        </SectionTracker>

        {/* Course outline */}
        <SectionTracker name="outline">
          <section id="outline" className="scroll-mt-20 bg-white px-4 py-16">
            <div className="container mx-auto max-w-4xl">
              <h2 className="mb-8 text-center">Course Outline</h2>
              <CourseOutline days={outline} />
            </div>
          </section>
        </SectionTracker>

        {/* Meet your coach */}
        <SectionTracker name="coach">
          <section id="coach" className="scroll-mt-20 bg-bone px-4 py-16">
            <div className="container mx-auto grid items-center gap-10 lg:grid-cols-2">
              <div>
                <h2 className="mb-6">Meet your coach</h2>
                {coach.map((para, i) => (
                  <p
                    key={i}
                    className={
                      i > 0 ? "rounded-[2rem] bg-sky p-5" : undefined
                    }
                  >
                    {para}
                  </p>
                ))}
              </div>
              <Image
                src="/images/course/meet-coach.png"
                alt="Selena Trotter"
                width={621}
                height={416}
                className="h-auto w-full"
              />
            </div>
          </section>
        </SectionTracker>

        {/* Who this course is for / not for */}
        <SectionTracker name="audience">
          <section id="audience" className="scroll-mt-20 bg-white px-4 py-16">
            <div className="container mx-auto grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] bg-sky/40 p-8">
                <h2 className="mb-6">Who this course is for:</h2>
                <ul className="blue-checkmark-list space-y-3 pl-10">
                  {audience.whoFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[2rem] bg-brown p-8 text-white">
                <h2 className="mb-6 text-white">
                  Who this course is NOT for:
                </h2>
                <ul className="brown-checkmark-list space-y-3 pl-10">
                  {audience.whoNotFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </SectionTracker>

        {/* Pre-launch bonuses */}
        <section
          id="prelaunch"
          className="scroll-mt-20 bg-cover bg-center px-4 py-16"
          style={{
            backgroundImage: "url(/images/course/limited-time-banner.png)",
          }}
        >
          <div className="container mx-auto text-center">
            <h3 className="mb-6 text-3xl">Limited Time Pre-Launch Bonuses</h3>
            <ul className="mb-8 space-y-2 text-lg">
              <li>
                <b>Free Community Access</b>
              </li>
              <li>
                <b>Customized Course</b>
              </li>
              <li>
                <b>Early Access to Coaching Program</b>
              </li>
            </ul>
            <EnrollButton href={href} location="prelaunch">
              Enroll Now
            </EnrollButton>
          </div>
        </section>

        {/* FAQs */}
        <SectionTracker name="faqs">
          <section id="faqs" className="scroll-mt-20 bg-bone px-4 py-16">
            <div className="container mx-auto">
              <h2 className="mb-10 text-center">Frequently asked questions</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {faqs.map((faq) => {
                  const Icon = faqIcon(faq.icon);
                  return (
                    <div
                      key={faq.question}
                      className="rounded-[1.5rem] border border-cream bg-white p-6"
                    >
                      <Icon
                        className="float-right ml-3 size-5 text-brown"
                        aria-hidden
                      />
                      <h3 className="mb-3 text-xl text-brown">
                        {faq.question}
                      </h3>
                      <p className="mb-0">{faq.answer}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-10 text-center">
                <EnrollButton href={href} location="faqs">
                  Unlock Your Course
                </EnrollButton>
              </div>
            </div>
          </section>
        </SectionTracker>
      </main>

      {/* Disclaimer */}
      <SectionTracker name="disclaimer">
        <section
          id="disclaimer"
          className="scroll-mt-20 bg-espresso px-4 py-16 text-white"
        >
          <div className="container mx-auto">
            <h2 className="mb-8 text-white">Disclaimer</h2>
            <div className="space-y-6">
              {disclaimers.map((d) => (
                <div key={d.title}>
                  <h3 className="mb-2 text-xl text-white">{d.title}</h3>
                  <p className="mb-0 text-white/80">{d.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 mb-0 text-xs text-white/60">
              &copy; {new Date().getFullYear()} HoundAwayFromHome.com. All rights
              reserved.
            </p>
          </div>
        </section>
      </SectionTracker>
    </>
  );
}
