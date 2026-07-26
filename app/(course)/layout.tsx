import { CourseNav } from "@/components/layout/CourseNav";

/**
 * Course sales page layout: its own nav, no site header/footer. The legal
 * disclaimer that closes the page is part of the page itself, as in the PHP.
 *
 * data-surface="white" — the course page set no bg class on <html>, unlike the
 * main site (cream) and the funnel pages (brown).
 */
export default function CourseLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-surface="white" className="flex min-h-full flex-1 flex-col">
      <CourseNav />
      {children}
    </div>
  );
}
