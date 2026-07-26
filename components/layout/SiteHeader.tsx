"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { NAV_LINKS, SOCIALS, SITE } from "@/content/site";
import { SOCIAL_ICONS } from "@/components/icons/brand";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * Primary site navigation.
 *
 * Differences from includes/navigation.php, all deliberate:
 *  - ONE nav array drives both breakpoints. The PHP (and the earlier migration
 *    attempt) duplicated the entire link list for mobile and desktop, which
 *    doubled the DOM, duplicated the landmark links for screen readers, and
 *    left two sources of truth.
 *  - Mobile uses shadcn's Sheet, so it gets a focus trap, Escape handling and
 *    scroll lock. The Bootstrap collapse had none of those.
 *  - Active state compares real pathnames. The PHP matched on `.php` basename,
 *    so it never highlighted once the extensionless URLs went live.
 *  - The responsive logo is one <Image> with a CSS-driven source swap rather
 *    than two <Image> elements, only one of which was ever visible.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav aria-label="Page navigation" className="bg-cream">
      <div className="container mx-auto flex items-center justify-between gap-4 px-3 py-2">
        <Link href="/" className="shrink-0" aria-label={`${SITE.name} home`}>
          {/* The PHP swapped between logo-horizontal and logo-horizontal-thin at
           * the `sm` breakpoint by rendering both and hiding one. */}
          <Image
            src="/images/logo-horizontal.png"
            alt={SITE.name}
            width={1627}
            height={198}
            priority
            className="hidden h-8 w-auto sm:block"
          />
          <Image
            src="/images/logo-horizontal-thin.png"
            alt={SITE.name}
            width={930}
            height={198}
            priority
            className="h-8 w-auto sm:hidden"
          />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map(({ href, label, badge }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`rounded px-3 py-2 text-espresso transition-colors hover:text-brand ${
                isActive(href) ? "font-bold" : ""
              }`}
            >
              {label}
              {badge ? (
                <sup className="ml-0.5 font-bold text-brand">{badge}</sup>
              ) : null}
            </Link>
          ))}
          <span className="mx-1 h-5 w-px bg-brown/25" aria-hidden />
          {SOCIALS.map(({ key, label, href }) => {
            const Icon = SOCIAL_ICONS[key];
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="rounded p-2 text-espresso transition-colors hover:text-brand"
              >
                <Icon className="size-4" />
              </a>
            );
          })}
        </div>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-cream">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              {NAV_LINKS.map(({ href, label, badge }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={`rounded px-2 py-3 text-lg text-espresso ${
                    isActive(href) ? "font-bold" : ""
                  }`}
                >
                  {label}
                  {badge ? (
                    <sup className="ml-0.5 font-bold text-brand">{badge}</sup>
                  ) : null}
                </Link>
              ))}
              <div className="mt-4 flex gap-2 border-t border-brown/20 pt-4">
                {SOCIALS.map(({ key, label, href }) => {
                  const Icon = SOCIAL_ICONS[key];
                  return (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="rounded p-2 text-espresso hover:text-brand"
                    >
                      <Icon className="size-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
