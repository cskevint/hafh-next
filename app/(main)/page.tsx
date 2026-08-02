import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LOCATIONS, MAPS_EMBED_URL, REVIEW_PLATFORMS } from "@/content/site";

/**
 * Homepage — ported from index.php.
 *
 * Copy is verbatim. Structure and section order are unchanged. Notable
 * conversions:
 *
 *  - The hero was a CSS `background-image` on a div, which means the LCP image
 *    can be neither optimized nor preloaded. It's now <Image fill priority>
 *    with the dark gradient as a sibling overlay. Same visual result,
 *    optimizable and preloadable.
 *  - `rounded-0 rounded-sm-5` came from a CUSTOM Bootstrap build that made the
 *    rounded utilities responsive. rounded-5 is $border-radius-2xl = 2rem, so
 *    that pair means "square on phones, 2rem from 576px up".
 *  - All five images were bare <img>. They're next/image now, and the four
 *    review logos had no alt text.
 *  - Internal links pointed at `.php` URLs, which would each cost a 301.
 */
const SERVICES = [
  {
    title: "Dog boarding",
    image: "/images/image2.jpg",
    body: "Discover our professional dog boarding services, providing a safe and comfortable environment for your pet while you're away.",
  },
  {
    title: "Doggy daycare",
    image: "/images/image1.jpg",
    body: "Explore our trusted dog daycare services, offering a stimulating and supervised environment for your furry friend to socialize and play while you're busy.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <div className="header-bg">
        <main>
          <div className="container mx-auto px-4 py-6">
            <div className="relative overflow-hidden rounded-none p-4 sm:rounded-[2rem] sm:p-12">
              <Image
                src="/images/hero.jpg"
                alt=""
                fill
                priority
                sizes="(max-width: 1400px) 100vw, 1320px"
                className="object-cover"
              />
              {/* The original gradient: rgba(0,0,0,.5) -> rgba(0,0,0,.25) */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/25"
              />
              <div className="relative px-4 py-12">
                <h1 className="text-5xl leading-[1.2] font-bold text-white">
                  Safe, Loved, and Pampered
                </h1>
                <p className="mb-4 max-w-2xl text-2xl leading-normal text-white">
                  Dog boarding and daycare reimagined: the ultimate comfort of
                  home for your dog.
                </p>
                {/* Matches the measured production CTA: brand blue, pill,
                  * 20px text, 8px/24px padding. shadcn's size="lg" caps height
                  * at h-9 (36px) with text-sm, so h-auto + py-2 is needed to
                  * reach Bootstrap's btn-lg proportions. */}
                <Button
                  asChild
                  className="h-auto rounded-full px-6 py-2 text-xl"
                >
                  <Link href="/contactus">Book with us now!</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <section className="bg-bone">
        <div className="container mx-auto p-4 md:p-6 lg:p-12">
          <h1 className="mb-2 md:mb-12">Services</h1>
          <p className="text-xl leading-normal">
            Hound Away From Home is a home-based dog boarding and daycare
            service conveniently located in the heart of the Peninsula. You&rsquo;ll
            love that a family is caring for your dog when you go on vacation!
            Daily pictures, a large backyard, and other friendly playmates are
            just some of the perks of your pup&rsquo;s stay at Hound Away From Home.{" "}
            <Link href="/faqs" className="text-brand">
              <strong>Learn more...</strong>
            </Link>
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 md:justify-center">
            {SERVICES.map(({ title, image, body }) => (
              <div
                key={title}
                className="overflow-hidden rounded-none bg-white sm:rounded-[2rem]"
              >
                <Image
                  src={image}
                  alt={title}
                  width={1536}
                  height={1536}
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="h-auto w-full"
                />
                <div className="p-5">
                  <h3>{title}</h3>
                  <p className="mb-0">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="container mx-auto p-4 md:p-6 lg:p-12">
          <h1 className="mb-2 md:mb-12">Read our reviews!</h1>
          {/* Two across on phones, not one. At one column each logo rendered
            * ~146px tall plus padding, so this block alone ran about a full
            * phone screen of nothing but logos between two content sections.
            * Paired up they stay comfortably legible and cost half the scroll.
            *
            * flex-wrap rather than a grid because the list is now an odd count
            * (three, since Facebook came out) — `justify-center` centres the
            * leftover item instead of stranding it in column one. */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {REVIEW_PLATFORMS.map(({ label, href, logo }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-[42%] items-center justify-center px-4 py-3 transition-opacity hover:opacity-80 lg:w-[20%]"
              >
                <Image
                  src={logo}
                  alt={`Read our reviews on ${label}`}
                  width={512}
                  height={202}
                  className="h-auto max-w-full"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-tan">
        <div className="container mx-auto p-4 md:p-6 lg:p-12">
          <h1 className="mb-2 md:mb-12">Locations</h1>
          <div className="lg:mx-auto lg:w-2/3">
            <div className="google-maps">
              <iframe
                src={MAPS_EMBED_URL}
                title="Map of Hound Away From Home locations in San Mateo"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="mt-12 text-xl leading-normal">
              Now open in two San Mateo locations!
            </p>
            {/* `text-brown` (#956230) on `bg-tan` (#e1b482) is about 2.8:1 —
              * below the 4.5:1 WCAG AA floor, and these are the only links in
              * the section. `text-espresso` clears it comfortably. The underline
              * is now permanent rather than hover-only: hover does not exist on
              * a phone, so without it these read as plain text. */}
            <ul className="list-disc pl-8">
              {LOCATIONS.map(({ name, cross, href }) => (
                <li key={name} className="py-1">
                  {name} @{" "}
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-espresso underline underline-offset-4 hover:text-brand"
                  >
                    {cross}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
