"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { trackCourseOutlineExpand } from "@/lib/analytics";

type Day = {
  readonly id: string;
  readonly title: string;
  readonly lessons: readonly { readonly title: string; readonly description: string }[];
};

/**
 * The 9-day / 52-lesson course outline.
 *
 * type="multiple" because the PHP's `data-parent="#courseOutline"` is Bootstrap
 * 4 syntax that BS5 ignores — panels already opened independently there, so
 * single-open would be a behavior change.
 *
 * The expand/collapse-all label is REAL TEXT. The PHP injected it via CSS
 * (`#courseOutlineToggle:before { content: "Expand All" }`), which leaves the
 * button with no reliable accessible name.
 *
 * Note lesson titles render as h4: Radix wraps AccordionTrigger in an h3, so the
 * PHP's h3 lesson titles move down one level. The page had no h4s at all before.
 */
export function CourseOutline({ days }: { days: readonly Day[] }) {
  const [open, setOpen] = useState<string[]>([]);
  const allOpen = open.length === days.length;

  function toggleAll(event: React.MouseEvent<HTMLButtonElement>) {
    if (allOpen) {
      setOpen([]);
    } else {
      setOpen(days.map((d) => d.id));
      // Fires on expand only, never on collapse — preserving the PHP's asymmetry.
      trackCourseOutlineExpand();
    }
    event.currentTarget.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      <div className="mb-4 flex justify-center">
        <Button
          variant="outline"
          onClick={toggleAll}
          aria-expanded={allOpen}
          /* `h-auto` overrides the size variant's height, so this control opted
           * out of the 44px mobile minimum the Button sizes provide. `min-h-11`
           * puts it back below md without changing the desktop pill. */
          className="h-auto min-h-11 rounded-full px-6 py-2 md:min-h-0"
        >
          {allOpen ? "Collapse All" : "Expand All"}
        </Button>
      </div>

      <Accordion
        type="multiple"
        value={open}
        onValueChange={setOpen}
        className="overflow-hidden rounded-[20px] border border-[#d7eaf2]"
      >
        {days.map((day) => (
          <AccordionItem
            key={day.id}
            value={day.id}
            className="border-b border-[#d7eaf2] last:border-b-0"
          >
            <AccordionTrigger className="bg-white px-4 py-4 text-left text-xl hover:no-underline data-[state=open]:bg-[rgba(238,250,255,0.5)]">
              {day.title}
            </AccordionTrigger>
            <AccordionContent
              className="px-4 pb-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(238,250,255,0.5) 0%, rgba(227,247,255,0.5) 100%)",
              }}
            >
              <div className="py-2">
                {day.lessons.map((lesson) => (
                  <div
                    key={lesson.title}
                    className="border-b border-[#dfe5e8] py-3 last:border-b-0"
                  >
                    <h4 className="mb-1 text-lg">{lesson.title}</h4>
                    <p className="mb-0">{lesson.description}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
