/**
 * The bone-colored rounded panel shared by /aboutus, /faqs, /services and the
 * error pages.
 *
 * In the PHP this was repeated inline on every page as
 *   section.container-fluid.bg-info > div.container.p-lg-5.p-md-4.p-3.px-0
 *     > div.bg-light.rounded-5.p-lg-5.p-md-4.p-3
 *
 * rounded-5 is $border-radius-2xl = 2rem, and main.css squared it off below
 * 576px via `@media (max-width:576px) { .rounded-5 { border-radius: 0 } }`.
 */
export function Panel({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-cream">
      {/* No top padding below sm. That padding exists to let the cream show as a
        * frame around the rounded panel — but below sm the panel is
        * `rounded-none` and full-bleed, so there is nothing to frame. All it did
        * there was put a 16px cream strip between the cream nav and the panel.
        * Being the same cream, it merged into the header and read as the header
        * having a stray 16px of bottom padding. */}
      <main className="container mx-auto pb-4 sm:pt-4 md:p-6 lg:p-12">
        <div className="rounded-none bg-bone p-4 md:p-6 lg:p-12 sm:rounded-[2rem]">
          {title ? <h1 className="mb-3">{title}</h1> : null}
          {children}
        </div>
      </main>
    </section>
  );
}
