# hafh-next

[houndawayfromhome.com](https://www.houndawayfromhome.com) — Next.js 16 (App
Router) + Tailwind v4 + shadcn/ui, deployed on Vercel.

Replaces the PHP/Apache/Bootstrap site in `../hafh-web`. See
[`plans/2026-07-26-php-to-nextjs-migration.md`](plans/2026-07-26-php-to-nextjs-migration.md)
for the full migration plan, the bugs found in the old site, and the Phase 0
findings measured against production.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in what you need; see notes below
npm run dev
```

Everything degrades gracefully without credentials **except `ADMIN_PASSWORD`**,
which fails closed — `/admin/leads` returns 401 until it's set.

## Scripts

| command | what it does |
|---|---|
| `npm run dev` | dev server (Turbopack) |
| `npm run build` | production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | eslint — **`next build` no longer runs lint in Next 16**, so CI must call this |
| `npm run check:redirects -- --base <url>` | asserts the full legacy URL surface |

### `check:redirects`

The single most important check in the repo. Apache rewrote extensionless paths
to `.php`, so both `/faqs` and `/faqs.php` have been indexed for years. A missed
redirect is a silent 404 on an indexed, possibly ad-targeted URL.  Run it against
every preview deploy and against production immediately after cutover.

```bash
npm run check:redirects -- --base https://www.houndawayfromhome.com
```

## Layout

```
app/
  (main)/      site pages — shared header + footer
  (landing)/   funnel pages — logo band + legal footer, no nav
  (course)/    course sales page — its own nav
  admin/       password-gated
components/
  ui/          shadcn output — vendored, do not hand-edit
  layout/ forms/ course/ quiz/ media/ analytics/ icons/
content/       all copy and structured page data
lib/
  actions/     'use server' wrappers (thin)
  leads/       lead persistence and reads (pure, testable)
  email/ schemas.ts analytics.ts recaptcha.ts hubspot.ts routes.ts
proxy.ts       admin gate (Next 16 renamed middleware.ts -> proxy.ts)
```

**Content lives in `content/`, not beside routes.** Rule of thumb: repeated
structure with varying values goes in `content/`; unique structure goes in a
component.

`content/course/generated.ts` was produced by
`scripts/extract-course-content.mjs`, which scrapes the live PHP page. Treat it
as hand-maintained now — edit it directly. The script is kept for provenance.

## Things that will bite you

- **`lib/routes.ts` is the single source** for redirects, the sitemap, robots,
  and the redirect checker. Change URLs there, nowhere else.
- **Colors are renamed.** Bootstrap's names were semantically inverted (`info`
  was cream, `warning` light blue, `success` tan, `danger` near-black). The
  palette is now `brand / brown / tan / cream / sky / ink / bone / espresso`,
  plus `brand-bright` and `cta` for the course page's two off-palette colors.
- **Don't override shadcn tokens in `:root`.** `shadcn/tailwind.css` declares
  its own `:root` *after* anything `app/globals.css` writes, so those overrides
  lose the cascade. Map them in `@theme` instead.
- **The course page's seven `ViewContent` events are load-bearing.** Meta's
  optimizer runs on them. `SectionTracker` deliberately decouples tracking from
  the heading hierarchy so headings can be fixed without changing the event set.
  See `lib/analytics.ts`.
- **Heading sizes come from `@layer base`,** measured from production. Tailwind
  Preflight resets headings to `inherit`, and most headings on this site carry
  no size class.

## Deploying

Vercel, on push. Set env vars in project settings. Point apex → `www` (308).
Before cutover, run `check:redirects` against the preview URL.
