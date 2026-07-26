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
      <main className="container mx-auto py-4 md:p-6 lg:p-12">
        <div className="rounded-none bg-bone p-4 md:p-6 lg:p-12 sm:rounded-[2rem]">
          {title ? <h1 className="mb-3">{title}</h1> : null}
          {children}
        </div>
      </main>
    </section>
  );
}
