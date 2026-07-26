/**
 * Site-wide constants — the keystone content module.
 *
 * next.config.ts redirects, app/sitemap.ts, SiteHeader, SiteFooter, and
 * EnrollButton all derive from here, so a URL cannot drift between the nav and
 * the sitemap. If a value appears in more than one place on the site, it
 * belongs in this file.
 */

export const SITE = {
  name: "Hound Away From Home",
  legalName: "Hound Away From Home, LLC",
  url: "https://www.houndawayfromhome.com",

  /** Default meta description, verbatim from includes/head-tag-contents.php.
   * The earlier migration attempt silently replaced this with the footer
   * blurb — an unintentional SEO edit. */
  description:
    "Welcome to Hound Away from Home, where your beloved canine companion finds a safe haven for boarding and daycare, ensuring they receive the care, attention, and fun they deserve while you're away.",

  /** Site-wide fallback OG image. Per-page overrides live on each page. */
  shareImage: "/images/share/eli.jpg",

  /** Shown to users when a form fails. Note this differs from where mail is
   * actually delivered, which is a server-side env var. */
  publicEmail: "selena@houndawayfromhome.com",

  /** Footer blurb (includes/footer.php). */
  blurb:
    "At Hound Away from Home, we're committed to providing top-quality boarding and daycare services for your furry family member, giving you peace of mind knowing they're in loving hands while you're apart.",
} as const;

/**
 * Primary navigation.
 *
 * `/at-home-dog-boarding-course` is linked DIRECTLY rather than via the `/course`
 * shortlink. The PHP nav pointed at `/course`, which meant every nav click paid
 * a redirect hop. The shortlink still exists for ad creative and QR codes.
 */
export const NAV_LINKS = [
  {
    href: "/at-home-dog-boarding-course",
    label: "Online Course",
    badge: "NEW!",
  },
  { href: "/faqs", label: "FAQs" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contactus", label: "Contact Us" },
  { href: "/aboutus", label: "About Us" },
] as const;

/** Footer "Quick links" column. Points at canonical extensionless URLs; the
 * PHP used `.php` hrefs here. */
export const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/faqs", label: "FAQs" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contactus", label: "Contact Us" },
  { href: "/aboutus", label: "About Us" },
] as const;

export const SOCIALS = [
  {
    key: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/houndawayfromhome/",
  },
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/houndawayfromhomeinc/",
  },
  {
    key: "yelp",
    label: "Yelp",
    href: "https://www.yelp.com/biz/hound-away-from-home-san-mateo",
  },
  {
    key: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@HoundAwayFromHome",
  },
] as const;

export type SocialKey = (typeof SOCIALS)[number]["key"];

/** Review-platform badges on the homepage. Rover appears here but not in the
 * nav, since there is no Rover icon in the nav row. */
export const REVIEW_PLATFORMS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/houndawayfromhome/",
    logo: "/images/logo-facebook.png",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/houndawayfromhomeinc/",
    logo: "/images/logo-instagram.png",
  },
  {
    label: "Yelp",
    href: "https://www.yelp.com/biz/hound-away-from-home-san-mateo",
    logo: "/images/logo-yelp.png",
  },
  {
    label: "Rover",
    href: "https://www.rover.com/members/leila-g-loving-family-at-home-full-time/",
    logo: "/images/logo-rover.png",
  },
] as const;

export const LOCATIONS = [
  {
    name: "Northern location",
    cross: "Tilton Ave & N Grant St",
    href: "https://maps.app.goo.gl/MHRQ2CakjJwrXeZR8",
  },
  {
    name: "Southern location",
    cross: "7th Ave & Humboldt St",
    href: "https://www.instagram.com/houndawayfromhomessm/",
  },
] as const;

export const MAPS_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d12649.037382027613!2d-122.3207829!3d37.5725103!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808f9e786d2c5a89%3A0x5f25f305b0b1a181!2sHound%20Away%20From%20Home!5e0!3m2!1sen!2sus!4v1713274048009!5m2!1sen!2sus";

/**
 * Kajabi checkout offers — an ALLOWLIST, deliberately.
 *
 * The PHP interpolated `$_REQUEST['offer']` straight into the Kajabi URL, so
 * any visitor could change what the page sold by editing a query param. Only
 * keys in this map are honored; anything else falls back to `default`.
 *
 * The base URL matters: enroll.php still pointed at the older
 * learn.houndawayfromhome.com host while the course page had already moved to
 * hafh.mykajabi.com (commit 68436c0). That split meant the quiz's three CTAs
 * were sending people to a stale checkout. Standardized here on the newer host.
 */
export const ENROLL_OFFERS = {
  default: "kfgaAStf",
} as const;

export type EnrollOfferKey = keyof typeof ENROLL_OFFERS;

export function enrollUrl(offer?: string | null): string {
  const key = (offer ?? "default") as EnrollOfferKey;
  const id = ENROLL_OFFERS[key] ?? ENROLL_OFFERS.default;
  return `https://hafh.mykajabi.com/offers/${id}/checkout`;
}

/** Legal disclaimer on the standalone funnel pages (ebook, guide, quiz, video). */
export const LANDING_DISCLAIMER =
  "This site is not a part of the Google website or Google Inc., Facebook/Meta website, or Meta, Inc. Additionally, this site is NOT endorsed by Google or Meta in any way.";
