import type { Metadata } from "next";
import Image from "next/image";
import { Panel } from "@/components/layout/Panel";
import { InstagramIcon } from "@/components/icons/brand";
import { Button } from "@/components/ui/button";
import { SOCIALS } from "@/content/site";

export const metadata: Metadata = {
  title: "Gallery",
  alternates: { canonical: "/gallery" },
};

/**
 * Ported from gallery.php.
 *
 * THE INSTAGRAM PROFILE EMBED IS GONE, deliberately. Verified against
 * production in Chrome: embed.js still loads and still renders an iframe
 * (540x581, class instagram-media-rendered) showing the profile header, avatar,
 * "422 followers" and "241 posts" — but all six post thumbnails are permanently
 * blank grey squares with only video play icons. The images never load, even
 * after a full load and scroll. Instagram deprecated profile embeds.
 *
 * Six empty grey boxes beside three good dog photos looks worse than either a
 * working embed or none at all, so it's replaced with a real follow link. This
 * also removes a cross-origin iframe and ~200 lines of inline placeholder
 * markup from the page.
 *
 * Also: all three gallery images were missing alt text (as were both nav logos).
 */
const PHOTOS = [
  { src: "/images/gallery2.jpg", alt: "A bulldog napping on a cushioned bed" },
  {
    src: "/images/gallery1.jpg",
    alt: "Two dogs resting together on a hardwood floor",
  },
  {
    src: "/images/gallery3.jpg",
    alt: "A beagle mix chewing a pink toy blanket",
  },
] as const;

const instagram = SOCIALS.find((s) => s.key === "instagram")!;

export default function GalleryPage() {
  return (
    <Panel title="Gallery">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PHOTOS.map((photo) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            width={1280}
            height={960}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-auto w-full rounded-lg"
          />
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-lg bg-cream/60 p-6 text-center">
        <h3 className="mb-0">See more of our pups</h3>
        <p className="mb-0 max-w-prose">
          We post daily pictures of every dog staying with us over on Instagram.
        </p>
        <Button asChild className="h-auto rounded-full px-6 py-2 text-lg">
          <a href={instagram.href} target="_blank" rel="noopener noreferrer">
            <InstagramIcon className="size-5" />
            Follow us on Instagram
          </a>
        </Button>
      </div>
    </Panel>
  );
}
