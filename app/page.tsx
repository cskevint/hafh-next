/**
 * TEMPORARY Phase 1 verification page.
 *
 * Proves fonts resolve, the type scale matches production, and the brand
 * palette renders. Replaced by the real homepage in Phase 3.
 */
const SWATCHES = [
  "bg-brand",
  "bg-brown",
  "bg-tan",
  "bg-cream",
  "bg-sky",
  "bg-ink",
  "bg-bone",
  "bg-espresso",
  "bg-brand-bright",
  "bg-cta",
] as const;

export default function ProbePage() {
  return (
    <main className="bg-white p-10 space-y-10">
      <section id="scale">
        <h1>h1 Safe, Loved, and Pampered</h1>
        <h2>h2 Safe, Loved, and Pampered</h2>
        <h3>h3 Safe, Loved, and Pampered</h3>
        <h4>h4 Safe, Loved, and Pampered</h4>
        <h5>h5 Safe, Loved, and Pampered</h5>
        <h6>h6 Safe, Loved, and Pampered (should be Lato)</h6>
        <p>p body copy in Lato at 16px / 1.5</p>
        <p className="font-heading font-bold text-5xl leading-[1.2]">
          display-5 fw-bold (hero h1 equivalent)
        </p>
      </section>

      <section className="flex flex-wrap gap-3">
        {SWATCHES.map((c) => (
          <div key={c} className="text-xs">
            <div className={`h-16 w-28 rounded border ${c}`} />
            <code>{c}</code>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <ul className="checkmark-list pl-10">
          <li>checkmark-list bullet</li>
        </ul>
        <ul className="blue-checkmark-list pl-10">
          <li>blue-checkmark-list bullet</li>
        </ul>
        <ul className="brown-checkmark-list pl-10">
          <li>brown-checkmark-list bullet</li>
        </ul>
        <div className="infobox rounded p-4">.infobox (hover me)</div>
      </section>
    </main>
  );
}
