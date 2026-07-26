import Image from "next/image";
import type { Metadata } from "next";
import { Panel } from "@/components/layout/Panel";
import { InstagramIcon } from "@/components/icons/brand";

export const metadata: Metadata = {
  title: "About Us",
  alternates: { canonical: "/aboutus" },
};

/**
 * Ported from aboutus.php. Copy verbatim.
 *
 * Fixes carried out during the port:
 *  - The Instagram links had `bi bi-instagram` icons that the earlier migration
 *    attempt dropped. Restored as inline SVG.
 *  - The Selena photo's alt text said "Nargiz" (wrong person) and Leila's said
 *    "Leila Gates." with a trailing period. Both corrected.
 *  - `rounded-start-pill-5` on the first image was a class that does not exist
 *    in the Bootstrap build — dead, so not carried over.
 */
const TEAM = [
  {
    role: "North Location",
    name: "Nargiz Ermatova",
    image: "/images/image-nargiz.jpg",
    width: 1024,
    height: 768,
    alt: "Nargiz Ermatova and family",
    bio: "Nargiz Ermatova, a dog lover and experienced caregiver based in San Mateo. She has been caring for dogs of all sizes for years and loves giving them attention, playtime, and plenty of cuddles. She also enjoys cooking, painting, and spending time outdoors. Your dog will be treated like part of Nargiz’s family!",
    instagram: "https://www.instagram.com/houndawayfromhomeinc/",
  },
  {
    role: "South Location",
    name: "Leila Gates",
    image: "/images/image-leila.jpg",
    width: 450,
    height: 450,
    alt: "Leila Gates",
    bio: "Leila Gates recently moved to the Bay Area and has started the second location for Hound Away From Home. She has over a decade of experience caring for dogs. Working from home with her homeschooling teenage daughters, they provide round-the-clock companionship and personalized care for each dog.",
    instagram: "https://www.instagram.com/houndawayfromhomessm/",
  },
  {
    role: "Owner",
    name: "Selena Trotter",
    image: "/images/image-selena.jpg",
    width: 1024,
    height: 743,
    alt: "Selena Trotter",
    bio: "Selena Trotter is very passionate about dogs and caring for them, and helps Leila and Nargiz run their businesses so that they can spend their time loving dogs. While not physically close anymore, Selena is in close contact with each of them so that we can ensure the smooth business operations of Hound Away from Home.",
    instagram: null,
  },
] as const;

export default function AboutUsPage() {
  return (
    <Panel title="About Us">
      <div className="space-y-4">
        {TEAM.map((member) => (
          <article
            key={member.role}
            className="grid overflow-hidden rounded-lg border border-brown/15 bg-white md:grid-cols-3"
          >
            <div className="bg-tan md:col-span-1">
              <Image
                src={member.image}
                alt={member.alt}
                width={member.width}
                height={member.height}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-5 md:col-span-2">
              <h5>{member.role}</h5>
              <p>{member.bio}</p>
              {member.instagram ? (
                <p className="mb-0">
                  Check out her{" "}
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brown underline-offset-4 hover:underline"
                  >
                    <InstagramIcon className="size-4" />
                    Instagram
                  </a>
                  !
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}
