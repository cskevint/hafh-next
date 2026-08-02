"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * The course page's own nav — separate from SiteHeader, matching the PHP, which
 * had two entirely separate navbars.
 *
 * All links are in-page anchors. The ids are load-bearing beyond navigation:
 * they may appear in ad creative, so they must keep working.
 */
const ANCHORS = [
  { href: "#testimonials", label: "Testimonials" },
  { href: "#learn", label: "What you'll learn" },
  { href: "#outline", label: "Course Outline" },
  { href: "#coach", label: "Meet your coach" },
  { href: "#audience", label: "Who this course is for" },
  { href: "#faqs", label: "FAQs" },
  { href: "#disclaimer", label: "Disclaimer" },
] as const;

export function CourseNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav aria-label="Course navigation" className="bg-white shadow-sm">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        {/* min-h-11: the logo is a 40px-tall image, just under the touch minimum. */}
        <Link
          href="/at-home-dog-boarding-course"
          className="flex min-h-11 items-center"
        >
          <Image
            src="/images/course/headerlogo.png"
            alt="Hound Away From Home online course"
            width={400}
            height={100}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {ANCHORS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded px-2 py-2 text-sm text-espresso transition-colors hover:text-brand"
            >
              {label}
            </a>
          ))}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              {ANCHORS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded px-2 py-3 text-lg text-espresso"
                >
                  {label}
                </a>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
