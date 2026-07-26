# Migrate houndawayfromhome.com from PHP to Next.js on Vercel

## Context

`hafh-web/` is a PHP 8 / Apache / Bootstrap 5 site for Hound Away From Home (dog boarding & daycare, San Mateo CA) plus an online course funnel. It's deployed at www.houndawayfromhome.com and deploys by hitting `/admin/updatesite` which runs `git pull --rebase` on the host. Content is hardcoded in PHP, forms post to PHP handlers that email via PHPMailer over SMTP port 25, and leads land in CSV files on disk.

We're rebuilding it as a Next.js App Router app in a **new standalone git repo** at `hafh-next/`, deployed on Vercel. Full feature parity, all URLs preserved, same-or-better look and feel. Once verified, `hafh-web` gets deleted and the domain repoints to Vercel.

**A prior in-place migration attempt exists** on the `hafh-web` branch `nodejs` at commit `530fa4f` (read with `git show 530fa4f:<path>` from inside `hafh-web`). It is ~15% complete and the remaining 85% is the hard 85% — every interactive page (`/contactus`, the quiz, both lead magnets, the Vimeo page, the 825-line course page), `/admin/leads`, `sitemap`, and `robots` were never started. Its `lib/` layer is genuinely reusable; its presentation layer mostly is not. It also contains several bugs we must not carry forward (catalogued below). We port it forward selectively into a clean structure — we do not build on the branch.

### Decisions locked with the user

| Area | Decision |
|---|---|
| Repo | New standalone git repo at `hafh-next/`. Only Next.js artifacts — no PHP, `vendor/`, `styles/sass/`, `_archive/`. |
| Lead storage | **Vercel Blob, `access: 'private'`** (GA 2026-06-30; auto-rotating OIDC on Vercel, no static token in prod). |
| Email | **Resend** (replaces PHPMailer/nodemailer SMTP:25, which is blocked on Vercel serverless). |
| Visual | **Faithful + polish.** Exact palette, layout structure, and all copy preserved. Improvements: real type scale, spacing rhythm, `next/image` everywhere, 18.5MB of course GIFs → looping video, subtle motion, better focus/a11y. No page restructured or recopywritten. |
| UI primitives | **shadcn/ui** — exactly 11: `accordion, alert, button, dialog, input, label, progress, radio-group, sheet, switch, textarea`. |
| Admin auth | Shared password from env var: HTTP Basic in middleware **and** re-checked in the page. |
| Enroll URL | `https://hafh.mykajabi.com/offers/{offer}/checkout` **everywhere**, including the quiz's 3 CTAs (which currently hit the stale `learn.houndawayfromhome.com` URL via `enroll.php`). |
| Ebook flow | **Keep current behavior** — notify the owner, show "download link is on its way", send nothing. Do not commit the 10.5MB PDF (it's referenced nowhere in the codebase). |
| Palette | **Rename to descriptive** names in `@theme`; keep Bootstrap names as temporary aliases during transliteration, delete in a final commit. |

Once the repo exists, this plan is copied to `hafh-next/plans/2026-07-26-php-to-nextjs-migration.md`.

---

## Framework constraints (Next.js 16.2.12)

Verified against the bundled docs in `node_modules/next/dist/docs/`, which the scaffold's `AGENTS.md` requires reading before writing code. Several of these invalidate assumptions in the original plan text.

1. **`middleware.ts` is renamed `proxy.ts`.** Root-level `proxy.ts`, exporting `proxy` (named or default). Same `config.matcher` semantics. Config flags renamed too (`skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`). The admin Basic-auth gate goes here.
2. **Async request APIs — synchronous access is fully removed** (it was merely deprecated in 15). `cookies()`, `headers()`, `draftMode()`, and `params`/`searchParams` in pages, layouts, and route handlers are all Promises. The course page's `?offer=` read and the quiz's `?question=` read must `await`. Run `npx next typegen` to get the `PageProps<'/route'>` / `LayoutProps` / `RouteContext` helpers and type these properly rather than hand-writing prop types.
3. **`data-scroll-behavior="smooth"` is now opt-in on `<html>`.** Next no longer overrides global `scroll-behavior: smooth` during route transitions. Since the course page uses smooth in-page anchor scrolling and `scrollIntoView({behavior:'smooth'})`, set this attribute so *route* navigations still jump instantly while in-page anchors stay smooth.
4. **`next lint` is removed and `next build` no longer lints.** Lint is a separate `eslint` script, so CI must run it explicitly — a build passing is no longer evidence lint passed.
5. **Turbopack is the default bundler.** No custom webpack config to port (we have none).
6. **`next/image` defaults changed**: `16` removed from `imageSizes`, new `minimumCacheTTL` and `qualities` defaults, and local images with query strings behave differently. Relevant when tuning the course page's LCP work.
7. **PPR's `experimental_ppr` segment flag is removed**; `serverRuntimeConfig`/`publicRuntimeConfig` are gone (env vars only).

## Bugs on `530fa4f` that must NOT be carried forward

Each of these would have broken a page or a lead flow. They are the reason we rewrite rather than resume.

1. **`app/globals.css`**: `body { font-family: "Lato", serif }` — but Lato loads via `next/font/google`, which exposes only a hashed family via `--font-lato`. The literal `"Lato"` matches nothing, so all body copy renders as Times. Most visible bug on the branch.
2. **`lib/blob-storage.ts`**: `access: "public"` + `addRandomSuffix: false` → the entire subscriber list is anonymously enumerable at a deterministic URL. Also, `put()` with `addRandomSuffix: false` throws on an existing pathname without `allowOverwrite: true`, so the *second* newsletter signup ever would have thrown — silently, because the caller only `console.error`s while still telling the user "added". Also a lost-update race on read-modify-write.
3. **`app/api/newsletter/route.ts`**: `Footer.tsx` sends JSON; the route calls `request.formData()` → throws. And `new URL(referer)` with a `"/"` default → `Invalid URL`. Two independent 500s in 25 lines.
4. **`app/api/contact/route.ts`**: `new URL("/contactus", referer)` where `referer` defaults to the relative string `"/contactus"` → `TypeError: Invalid base URL`.
5. **`middleware.ts`** rewrites to `/not-found`, which is not a route; **`lead-capture/route.ts`** redirects to `/500`, also not a route.
6. **`app/(main)/faqs/page.tsx`**: `faqs.md` uses Parsedown-Extra features `react-markdown` doesn't support — `{.mt-4}` attribute blocks render as literal text in all 11 headings, and raw inline `<a>` tags render as escaped HTML source.
7. **`app/layout.tsx`**: FB pixel id left as the literal `'YOUR_PIXEL_ID'`; **no `openGraph` metadata at all** (destroying all 4 social share cards and the per-page `images/share/*.jpg`); default meta description silently changed; **the dev-mode `fbq` stub is missing**, so every `fbq()` call throws a `ReferenceError` in dev and on preview deploys, taking the surrounding handler down with it.
8. **`app/components/FlashMessage.tsx`**: reads a **non-`httpOnly`** cookie and renders it via `dangerouslySetInnerHTML` — a content-injection channel on every route. Delete, don't port; Server Actions remove the need.
9. **`app/(main)/layout.tsx`** and **`(main)/page.tsx`** both render `<FlashMessage />` → duplicate flash on the homepage.
10. **`next.config.ts`**: zero `.php` redirects — the single biggest omission.

### Pre-existing bugs in the PHP worth fixing during the port

- **reCAPTCHA v3 is decorative.** `includes/utility.php:validateCaptcha()` returns `$response['success']`, and v3 returns `success: true` for *any* structurally valid token regardless of score. There is effectively no bot protection on the contact form today. Needs `success && score >= 0.5 && action === 'contact'`.
- **The quiz lead gate is trivially bypassable.** `getRenderState()` keys off `count($_SESSION['quiz']) == 7`, so manually setting `?question=DONE` reveals results with no email submitted.
- **Contact submissions are never persisted** — `contactus-mail.php` emails and nothing else. If SMTP fails, the lead is gone and the visitor is told to email manually. Combined with a new email provider, this is the biggest single point of business data loss in the project.
- **`?offer=` is interpolated straight into the Kajabi URL** from `$_REQUEST`, so anyone can change what the page sells via a query param.
- **Newsletter's only defense** is `str_contains($email, 'serviseantilogin')`; **lead-capture's** is `preg_match('/http/', $name)`. One hardcoded spammer each, not filters.
- **`robots.txt` and the page meta fight each other**: `/introductory-guide-video` is both `Disallow`ed and `noindex`ed, so Google can't crawl it to see the `noindex`. Correct: drop the `Disallow`, keep `noindex`.
- **Three malformed-HTML regions in `at-home-dog-boarding-course.php`** (line 137: a `<p>` closed with `</h4>`; line 624: `</section>` without its `</div>`; line 706: a stray `</div>`). Browsers repair these silently; **JSX will not compile them**. Diff the *live DOM* (devtools → Copy outerHTML), not the PHP source, for the pre-launch banner and the audience/FAQ boundaries. This is the most likely source of "it looks subtly different and nobody can say why."
- Copy fixes to make deliberately: `"...behavioral challenges is neces"` (truncated mid-word, `at-home-dog-boarding-course.php:611`), `"Confirmed for vaccionations."` (typo in every lead email), `testimonial_cuau.jpg` has `alt="Sara Botero"` (wrong person), `500.php` has `pageTitle = "Not found"`.

---

## Target repo structure

```
hafh-next/
├── app/
│   ├── layout.tsx                  # <html>, fonts, metadata defaults+template, <Analytics/>
│   ├── globals.css                 # @import "tailwindcss"; @theme; @layer base; @layer components
│   ├── fonts/                      # Gilroy-{Medium,SemiBold,Bold}.woff2 — 3 files, not 7, not 20
│   ├── not-found.tsx  error.tsx  global-error.tsx
│   ├── sitemap.ts  robots.ts
│   ├── (main)/                     # SiteHeader + SiteFooter
│   │   ├── layout.tsx  page.tsx
│   │   └── {aboutus,contactus,faqs,gallery,services}/page.tsx
│   ├── (landing)/                  # LandingHeader + LegalFooter, no nav
│   │   ├── layout.tsx
│   │   └── {download-free-ebook,watch-introductory-guide,
│   │        introductory-guide-video,is-dog-boarding-right-for-me}/page.tsx
│   ├── (course)/                   # CourseNav + CourseLegalFooter
│   │   ├── layout.tsx
│   │   └── at-home-dog-boarding-course/page.tsx
│   └── admin/leads/page.tsx
├── components/
│   ├── ui/                         # shadcn CLI output ONLY — vendored, never hand-edited
│   ├── layout/                     # SiteHeader SiteFooter LandingHeader LegalFooter
│   │                               #   CourseNav CourseLegalFooter Container Section
│   ├── forms/                      # ContactForm NewsletterForm LeadCaptureForm
│   │                               #   FieldError SubmitButton Honeypot useRecaptcha.ts
│   │                               #   QuoteTypeToggle (the btn-check button-group look)
│   ├── course/                     # 17 components — see Phase 8
│   ├── quiz/                       # Quiz QuizQuestion QuizProgress QuizEmailGate
│   │   └── results/{Success,Consider,LearnMore}.tsx
│   ├── media/                      # HeroImage LoopingVideo YouTubePlayer VimeoPlayer
│   ├── analytics/                  # Analytics.tsx SectionTracker.tsx
│   └── icons/                      # Facebook Instagram Yelp YouTube (lucide has no brand icons)
├── content/                        # ALL copy + structured page data
│   ├── types.ts
│   ├── site.ts                     # KEYSTONE: nav, socials, locations, maps embed,
│   │                               #   enroll offers, contact emails
│   ├── faqs.ts                     # the 11 site FAQs (was faqs.md)
│   ├── quiz.ts                     # 7 questions + getQuizResult()
│   └── course/                     # outline faqs testimonials learn infoboxes
│                                   #   audience disclaimers coach prelaunch
├── lib/
│   ├── actions/                    # 'use server' — thin wrappers only
│   │   └── {contact,newsletter,lead-capture}.ts
│   ├── leads/                      # pure logic, no directive, unit-testable
│   │   └── {store,contact,newsletter,lead}.ts
│   ├── email/                      # resend client + render helpers
│   └── {schemas,analytics,recaptcha,hubspot,fonts,routes,env,utils}.ts
├── public/                         # curated — no PDF, no unused PNGs, no .DS_Store
├── plans/                          # this plan lives here
├── scripts/check-redirects.mjs
├── proxy.ts  next.config.ts  components.json  .env.example  CLAUDE.md  README.md
```

### Why `content/*.ts` for page data

The course page holds ~10 large PHP arrays (52 accordion lessons across 9 days, 16 FAQs, 6 disclaimers, 3 testimonials, 5 infoboxes, 2×7 audience lists, 3 coach paragraphs) and the quiz holds 7 questions.

- **Not MDX** — this is records, not prose. Expressing `{title, description}` pairs in MDX means frontmatter YAML with no markdown body: YAML with extra steps, no type safety, plus a build-time parse. The only genuinely prose file is `faqs.md`, and it turns out to be better as data too (11 fixed Q&As that want `FAQPage` JSON-LD).
- **Not colocated `*.data.ts`** — ~450 lines of marketing copy inside the route directory makes it unskimmable, and `app/` should be about routing and composition. More importantly, "where do I change the testimonial?" needs an answer the site owner can act on: `content/course/testimonials.ts` is one; `app/(course)/at-home-dog-boarding-course/testimonials.data.ts` isn't. A single `content/` tree also makes a future CMS swap one module rather than a hunt through `app/`.

Format: `export const courseOutline = [...] as const satisfies readonly CourseDay[]` — literal narrowing (so `day.id` is a union usable as Accordion values) *and* structural checking. Type `FaqIcon` as an explicit string union so the `bi-*` → lucide mapping is exhaustive at compile time instead of silently rendering nothing.

**Rule for this repo: repeated structure with varying values → `content/`; unique structure → a component.** The three quiz result panels are ~30 lines each of unique JSX (headings, `<b>`, emoji bullet lists, an embedded `<EnrollButton>`) — they go in `components/quiz/results/`, not `content/`. Forcing them into data means HTML strings and `dangerouslySetInnerHTML`, reintroducing the injection surface we're deleting.

`content/site.ts` is the keystone: `next.config.ts` redirects, `app/sitemap.ts`, `SiteHeader`, `SiteFooter`, and `EnrollButton` all derive from it, so a URL can't drift between the nav and the sitemap.

### Design tokens

`@theme` in `app/globals.css`. Same rendered colors, honest names:

```css
--color-brand: #0279ad;         --color-brown: #956230;
--color-tan: #e1b482;           --color-cream: #efd6ba;
--color-sky: #aae4f7;           --color-ink: #350d09;
--color-bone: #fcf7f3;          --color-espresso: #230906;
--color-brand-bright: #069ee0;  /* course hero gradient */
--color-cta: #bd4d3d;           /* course enroll buttons */
```

Also declare `--font-gilroy` / `--font-lato` in `@theme` (the branch omitted them, so there were no `font-gilroy` utilities). **Define the type scale once** in `@theme` + `@layer base` — Tailwind Preflight resets headings to `font-size: inherit; font-weight: inherit`, whereas Bootstrap gave `h1: 2.5rem/500`, `h2: 2rem/500`, `h3: 1.75rem/500`, `.display-5: 3rem/500`, `.fs-5: 1.25rem`. The branch compensated with ad-hoc `text-4xl font-bold` (2.25rem/700 — wrong size *and* weight) per heading. Don't re-guess per heading.

Drop Inter (loaded but never referenced in any CSS rule). Drop bootstrap-icons CDN (a render-blocking cross-origin stylesheet plus a webfont for ~28 glyphs) in favor of `lucide-react` + 4 hand-inlined brand SVGs. Ship 3 Gilroy weights as **woff2**, not the 7 raw `.ttf` the branch copied.

`<html>` background varies by route group (`bg-info` cream on main, `bg-secondary` brown on landing, none on course) and you can't set `<html>` classes per group with one root layout. Solution needing no JS: keep `html { background-color: var(--color-cream) }` in `globals.css`, have each group layout render a wrapper with `data-surface="brown"` / `"white"`, and add `html:has([data-surface="brown"]) { ... }`. `:has()` is Baseline. Only affects the iOS overscroll gutter, but it's visible.

### Form architecture: Server Actions

`components/forms/*` (client, `useActionState`) → `lib/actions/*` (`'use server'`, thin) → `lib/leads/*` (pure, unit-testable without a request).

Why, beyond style: it **deletes the `dangerouslySetInnerHTML` cookie-flash channel**; it gives **per-field errors with preserved input** (today a failed contact submission loses the user's entire message, including on legitimate failures like an SMTP hiccup — the highest-value UX fix in the migration, and free with `useActionState`); and it keeps `SiteFooter` a **Server Component** with only `NewsletterForm` as a client island, instead of the branch's `"use client"` on the entire footer for one `<input>`.

Progressive enhancement holds — `<form action={serverAction}>` submits natively. reCAPTCHA v3 needs JS, but so does the current site: `contactus.php` uses the auto-bind pattern with a JS `data-callback` that calls `form.submit()`, so zero-JS users can't submit today either. Pattern:

```tsx
const [state, formAction, pending] = useActionState(submitContact, initialState);
async function onSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  fd.set('g-recaptcha-response', await grecaptcha.execute(SITE_KEY, { action: 'contact' }));
  startTransition(() => formAction(fd));
}
```

Load `recaptcha/api.js` with `next/script strategy="lazyOnload"` in the **`(main)` layout**, not root — the course and landing pages shouldn't pay for it.

Redirects still belong where a flow *ends* in navigation: `redirect()` inside the action for ebook → `/at-home-dog-boarding-course` and guide → `/introductory-guide-video`. Contact, newsletter, and the quiz gate are same-page state.

Migration risk, honestly: no stable external POST endpoint (nothing posts externally today; and because logic lives in `lib/leads/*`, adding `app/api/contact/route.ts` later is a 10-line file, not a refactor); a bot POSTing garbage to `/contactus` gets a rendered error rather than a redirect; harder to `curl` — mitigated by unit tests against `lib/leads/*`.

**Minimum spam bar on all three forms** (post-migration each submission burns an invocation + a Resend send + two HubSpot calls + a Blob write): honeypot + reCAPTCHA v3 with score + zod validation, substring blocklist moved to a `SPAM_SUBSTRINGS` env var, and a Vercel Firewall rate-limit rule on the three page paths. Skip `@upstash/ratelimit` unless actually hit.

### Lead storage: one blob per submission

Not one aggregate JSON array — that's the branch's lost-update race and overwrite throw.

```
leads/newsletter/2026-07-26T18-04-11.312Z-<nanoid>.json
leads/ebook/...      leads/contact/...
```

`put()` with `access: 'private'`, `addRandomSuffix: true`. No read-before-write, no race, no overwrite flag, and each record holds the full payload plus `ip`/`userAgent`/`referer`. `/admin/leads` becomes `list({ prefix })` + parallel authenticated reads. **Verify the exact private-read API against the installed `@vercel/blob` version before building `/admin/leads` on it** — with `access: 'private'` the blob URL is not publicly fetchable, so the branch's bare `fetch(blob.url)` won't work.

---

## Phases

Each phase is independently verifiable. Order matters: the SEO/routing layer is **second**, not last, because it's the highest-risk-of-silent-damage area and the only one with an automated test.

### Phase 0 — Decisions and long-lead items (before any code)

- **Start Resend domain verification now.** DKIM/SPF DNS propagation is on the critical path and email *is* the business.
- Create the Vercel Blob store; **confirm private-read + OIDC auth on a throwaway preview deploy** before Phase 4 depends on it. OIDC only exists on Vercel, so local dev needs `vercel env pull` and a real token.
- Load the **live** `/gallery` and check whether the Instagram *profile* embed (`data-instgrm-permalink` → `/houndawayfromhomeinc/`, not a post) still renders — Instagram deprecated profile embeds, so it likely already degrades to a bare link. If dead: replace with three more gallery images plus a styled "Follow us on Instagram" link and drop `embed.js` (~200 lines of placeholder markup).
- Capture the **live DOM** of the course page's pre-launch banner and audience/FAQ boundaries (the 3 malformed-HTML regions).

### Phase 1 — Repo + skeleton

`git init` in `hafh-next/`, `create-next-app` (TS, App Router, no `src/`), Tailwind v4, `shadcn init` + the 11 components. Copy this plan to `plans/`. Write `CLAUDE.md`.

Assets: copy `images/` → `public/images/` **excluding** the 8.2MB of unreferenced `learn_*.png`, `paws{,1,2,3}.png`, `course-thumbnail.png`, `logo-640x640.png`, `logo-32x32.png`, the 0-byte `favicon.gif`, all `.DS_Store`, and the 10.5MB PDF. Convert 3 Gilroy weights to woff2 into `app/fonts/`. Fix `site.webmanifest` (empty `name`/`short_name`).

Then `globals.css` (`@theme` tokens + type scale + the ported custom rules from `styles/main.css`), `lib/fonts.ts`, `app/layout.tsx` (metadata defaults **including `openGraph` and `metadataBase`**, `<Analytics/>`), and the three group layouts.

Port from `styles/main.css`, dropping every Bootstrap-class-dependent selector (`.accordion-button`, `.form-check-input`, `.rounded-5`, `.enroll-modal`'s `--bs-modal-*`): `.hero-image` gradient, `.google-maps`, `.youtube-video`, the 3 checkmark-list bullet variants, `.infobox` hover, the `#courseOutline` accordion gradients and 20px corner rounding, `.ios-switch` (3em×1.5em, off `#e9ecef`/`#dee2e6`, on `#34c759`). `git show 530fa4f:app/globals.css` is a useful starting point but needs the font-family fix and the dead-selector purge.

Note the responsive `rounded-*` utilities are a **custom Bootstrap build feature and load-bearing** on the homepage hero and service cards (`rounded-0 rounded-sm-5`) — and `@media (max-width:576px) { .rounded-5 { border-radius: 0 } }` fights `rounded-sm-5`. Verify actual rendered behavior on production before porting.

**Verify:** `/` renders with correct fonts (this is where the `"Lato", serif` bug surfaces), correct palette, and a type scale measured side-by-side against production.

### Phase 2 — Routing + SEO layer

`lib/routes.ts` as the single source, feeding `next.config.ts` `redirects()`, `app/sitemap.ts`, `app/robots.ts`, and `scripts/check-redirects.mjs`.

**Canonical set: extensionless, no trailing slash, `www`, `https`.** Use `redirects()` in `next.config.ts`, not middleware — it compiles into Vercel's routing layer and resolves before any function boots. Don't use a regex like `/:slug*.php`; path-to-regexp treats `.` as a delimiter and suffix matching is fragile. There are only ~22 legacy URLs — enumerate them.

Status codes deliberately differ:

| From | To | Code | Why |
|---|---|---|---|
| `/index.php` | `/` | **301** | Canonical is `/`. |
| `/{aboutus,faqs,gallery,contactus,services,at-home-dog-boarding-course,download-free-ebook,watch-introductory-guide,introductory-guide-video,is-dog-boarding-right-for-me}.php` | extensionless | **301** | Indexed and in the sitemap; consolidates link equity. The `.php` form can never come back. |
| `/about/`, `/questions/`, `/photos/`, `/contact-us/` | `/aboutus`, `/faqs`, `/gallery`, `/contactus` | **301** (today 302) | Dead a decade; finally pass the equity. |
| `/contact`, `/ebook`, `/guide`, `/quiz`, `/course` | destinations | **302** | Marketing shortlinks in ad creative, QR codes, emails. A cached 301 permanently strands anyone who hit it once if you repoint it. Matches the PHP today. |
| `/{contact,ebook,guide,quiz,course,enroll}.php` | **final destination, not the shortlink** | **302** | One hop, don't chain. |
| `/enroll` | Kajabi | **302, non-negotiable** | This URL **already changed once** (`68436c0`, Feb 2026). A cached 301 sends paying customers to a dead checkout with no way to fix it. |
| `/404.php`, `/500.php` | — | **404** | Don't redirect error pages. |
| `/contactus-mail.php`, `/newsletter-capture.php`, `/contact-capture.php`, `/redirect.php`, `/admin/updatesite.php`, `/development.html` | — | **404/410** | POST handlers and dev scaffolding. |

In Vercel: apex → `www` (308); confirm `trailingSlash: false` (the default).

`app/sitemap.ts` contains **extensionless only** — 9 URLs, removing the four `.php` entries currently in `sitemap.xml`: `/` (1.0), `/aboutus` `/faqs` `/gallery` `/contactus` (0.8), `/at-home-dog-boarding-course` `/download-free-ebook` `/watch-introductory-guide` `/is-dog-boarding-right-for-me` (1.0). Excluded: `/introductory-guide-video` (noindex), `/services`, `/admin/*`, every redirect source. Add `alternates.canonical` on every page (only the quiz has one today).

`scripts/check-redirects.mjs`: a table of `[from, expectedStatus, expectedLocation]` for all ~22 legacy URLs plus the 10 canonicals, `fetch(..., { redirect: 'manual' })` against a `--base` URL, non-zero exit on mismatch. **The highest-leverage 60 lines in the project** — a missed `.php` redirect is a silent 404 on an indexed, possibly ad-targeted URL that nobody notices for weeks.

**Verify:** `check-redirects.mjs` green against a preview deploy.

### Phase 3 — `(main)` static pages

`content/site.ts`, `content/faqs.ts`. Then `SiteHeader` (one nav array, shadcn `Sheet` for mobile with focus trap + Escape + scroll lock, linking `/at-home-dog-boarding-course` **directly** so nav clicks don't cost a 307), `SiteFooter` (server) + `NewsletterForm` (client island), `/`, `/aboutus`, `/faqs`, `/gallery`, `/services`, `not-found.tsx`, `error.tsx`, `global-error.tsx`.

`/` — convert `.hero-image` from a CSS background to `<Image fill priority>` + a gradient overlay div so the LCP image is optimizable and preloadable. `next/image` on all five images.
`/faqs` — typed data, keep the identical flat `h3` + prose layout, add `FAQPage` JSON-LD (a real rich-results opportunity this page has never had). Drops `react-markdown` + `remark-gfm`.
`/aboutus` — restore the `bi-instagram` icons the branch dropped.
`/gallery` — add the missing `alt` attributes; apply the Phase 0 Instagram finding.

**Verify:** screenshot diff at 375/768/1440 against production.

### Phase 4 — Lead pipeline + admin

`lib/leads/store.ts` (private per-record blobs), `lib/email/` on Resend (`to` = `CONTACT_US_EMAIL`, `replyTo` = submitter — Resend's `reply_to` gives exact parity), `lib/hubspot.ts` (port `530fa4f` nearly as-is — it faithfully preserves the "no token ⇒ pretend the contact exists ⇒ skip create" semantics; wrap in `after()` from `next/server` so it doesn't block the redirect), `lib/recaptcha.ts` (**with the score threshold**), `lib/schemas.ts`, `proxy.ts` (Basic auth, timing-safe compare), `/admin/leads` (re-check auth in the page, `noindex`, `dynamic = 'force-dynamic'`).

Middleware alone isn't sufficient for a page rendering PII — matchers are easy to get subtly wrong and the failure mode is publishing your customer list.

**Verify:** write a lead from a preview deploy, read it in `/admin/leads`, and **confirm the blob URL 403s when fetched anonymously** — regression-test the exact bug being fixed.

### Phase 5 — `/contactus`

`ContactForm` + `lib/actions/contact.ts`. Fields exactly as today: `name`(req), `email`(req), `phone`, `quote` radio (daycare default), `boardingFrom`/`boardingTo` (revealed only when `quote=boarding`), `dogType`, `dogAge`, `dogState` radio, `dogVaccinations` switch, `message`, honeypot `fax_number`, reCAPTCHA v3.

**Budget real time for the form chrome** — two `btn-check` button groups, five `input-group`s with collapsed inner borders and prepended addons, and the `.ios-switch`. These are pure Bootstrap CSS with no shadcn equivalent (there is no shadcn "input group", and no "radio rendered as a joined button group"). Use a styled `RadioGroup`, not `ToggleGroup`, so the form still posts natively. This is the most tedious hand-work in the project; don't discover it late.

**Persist every submission to Blob *before* attempting the email, and make email failure non-fatal to the "we got it" message.** This matters more than anything else in this phase.

**Verify:** real email in the real inbox with correct `reply-to`; honeypot rejected; forged/absent token rejected; the Blob record exists even when the email send is forced to fail.

### Phase 6 — `(landing)`: ebook, guide, video

Shared `LeadCaptureForm` + `lib/actions/lead-capture.ts`. `LandingHeader` must be **prop-configurable** — the quiz shows a 200px logo plus a tagline on question 0 and a 100px logo with no tagline thereafter, which the branch's hardcoded 200px can't express. `LegalFooter`: fix the `http://` link to `https://`; `new Date().getFullYear()` changes the hardcoded `© 2025` to 2026 (fine, just deliberate).

`/introductory-guide-video`: `noindex` via metadata (not `robots.txt`), Vimeo player API, modal on `ended` **and** on the tab-refocus exit-intent state machine (`loaded` → `blurred` → `focused`).

**Verify:** HubSpot contact appears; both redirect destinations correct; Vimeo `ended` and tab-refocus both fire the modal.

### Phase 7 — Quiz

**Client state as source of truth, with the step number — and only the step number — mirrored to the URL** via `window.history.pushState` (supported since Next 14.1; `useSearchParams` observes it). Back/Forward works with no server round trip, and `?question=3` deep links keep working. Pure client state breaks Back, which users actually exercise in a 7-step quiz — Back would exit the page and lose all seven answers.

Answers stay **out** of the URL: today `?question=4&previousQuestion=work&previousAnswer=strict-hours` is a shareable URL containing a stranger's answers about their housing and employment, and it's likely why Google crawled a combinatorial explosion of parameterized variants. **The result panel renders only after the lead-capture action returns success** — closing the `?question=DONE` bypass. Still devtools-bypassable (the gate is a conversion mechanism, not a security boundary), but it closes the one real people find.

Old inbound URLs: `?question=0`–`6` → start at that question with no answers (matches PHP). `?question=EMAIL` / `DONE` → `replaceState` clean, start at 0 (PHP already did this for `DONE` with an incomplete session). `?question=7` / `abc` / negative → PHP 404'd; **deviate** and `replaceState` clean — 404ing on a bad query param is bad on a paid-traffic landing page. Strip `previousQuestion`/`previousAnswer`. Don't support the branch's invented `?done=true`.

Keep the existing canonical tag. Render only the matched result panel (the PHP ships all three in every response with `d-none`).

Safe polish: a `Progress` bar + "Question 3 of 7" (the PHP has no progress indicator at all, and 7-step quizzes without one have measurably worse completion) and an explicit Back button. Keep "Start over".

Branch order matters — reproduce exactly, `learn-more` gate first:
```
if (home === 'rent-strict' || work === 'strict-hours') return 'learn-more';
if (pet_care === 'professional' || business === 'excited') return 'success';
return 'consider';
```

**Verify:** all 21 option paths; all three branches including gate precedence; Back/Forward; `?question=N` deep links; the gate can't be URL-bypassed.

### Phase 8 — Course page

Last, because every primitive it needs now exists. 825 lines of PHP → a ~110-line `page.tsx` of pure composition, 17 components, 9 content modules.

Server: `Hero`, `PrelaunchBanner`, `Testimonials`/`TestimonialCard`, `WhyChoose`/`InfoBox`, `WhatYoullLearn`/`LearnMedia`, `Coach`, `Audience`, `PrelaunchBonuses`, `CourseFaqs`, `Disclaimer`, `CourseLegalFooter`.
Client: `CourseNav`, `CourseVideo`, `ReadMore`, `CourseOutline`, `EnrollButton`, `SectionTracker`.

**Delete `#comingSoonModal`** — its only occurrence is its own definition at line 739; nothing targets it.

**Accordion:** `data-parent="#courseOutline"` is Bootstrap 4 syntax that BS5 ignores, so items already open independently → shadcn `Accordion type="multiple"` controlled via `value: string[]`; expand-all is `setValue(allDayIds)` / `setValue([])`. Radix renders `<h3><button/></h3>`, so lesson titles move `<h3>` → `<h4>`. Replace the CSS-injected label (`#courseOutlineToggle:before { content: "Expand All" }`) with real text so the button has a reliable accessible name. Keep `scrollIntoView({behavior:'smooth'})`.

**GIFs → video:** `components/media/LoopingVideo.tsx`, `autoPlay loop muted playsInline preload="metadata"` + a real first-frame WebP `poster`, WebM/VP9 + MP4/H.264. 18.5MB → ~600KB at 720×405. iOS Low Power Mode blocks muted autoplay, so the poster must be a real frame, not a gray box — **test on a real iPhone**. Add `prefers-reduced-motion` handling (pause, don't autoplay).

**YouTube:** currently an eager `<iframe>` next to the h1 — hundreds of KB of third-party JS competing with LCP on the money page. Hand-roll a facade: poster + play button, mount the real iframe with `autoplay=1&enablejsapi=1` on click, then attach `YT.Player`. `next/third-parties`' `YouTubeEmbed` won't work — it gives no JS API, so we'd lose the video events. Behavior change: `VideoPlay` fires from the click rather than `onStateChange`. Same semantics, big LCP win.

**`?offer=` allowlist:** `export const enrollOffers = { default: 'kfgaAStf', ... } as const` in `content/site.ts`; `page.tsx` does `const { offer } = await props.searchParams` (async in Next 16 — see Framework constraints), looks it up, falls back to `default` on miss. Kills the injection and gives named campaign codes instead of raw Kajabi ids in ad URLs.

**Analytics — `lib/analytics.ts` as a thin typed facade**, not a hook (5 call sites don't justify one) and not inline (they absolutely justify one guard):

```ts
type FbqEvent = 'Lead' | 'ViewContent' | 'VideoPlay' | 'VideoPause' | 'VideoComplete';
export function fbqTrack(event: FbqEvent, params?: Record<string, string>) {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') {
    if (process.env.NODE_ENV !== 'production') console.log('[fbq]', event, params ?? '');
    return;
  }
  window.fbq('track', event, params);
}
```

This **is** the replacement for the PHP's dev stub — without it every call throws in dev and on previews and takes the surrounding handler down. The union type stops a typo from silently orphaning a Meta ad audience. `EnrollButton`'s `location` prop is typed to the seven existing literals (`'header' | 'discount' | 'testimonials' | 'learn' | 'why-choose' | 'prelaunch' | 'faqs'`) so a misspelling can't lose an attribution bucket. Preserve the asymmetry: `CourseOutline` fires `ViewContent` on expand-**to-open** only, not on collapse.

**`SectionTracker` — decouple tracking from heading tags.** The current scroll-listener tracker walks every `<h1>` and fires only for those with an `id`. There are 10 h1s; the hero and "Who this course is NOT for" have no `id`, the dead modal is never visible, and `why-choose` is an `<h2>` while `prelaunch` is an `<h3>` — so exactly **seven** events fire today: `testimonials`, `learn`, `outline`, `coach`, `audience`, `faqs`, `disclaimer`. Fixing the heading hierarchy (which we should — 9 h1s is an SEO/a11y problem) would silently change the event set and corrupt Meta historical comparison. So:

```tsx
<SectionTracker name="testimonials">
  <section id="testimonials"><h2>Testimonials</h2>…</section>
</SectionTracker>
```

`IntersectionObserver`, `threshold: 0`, fire once then `unobserve`. IO fires immediately for already-intersecting elements, preserving the "fires for whatever is in viewport at load" behavior exactly. Keep `content_type: 'heading'` even though it's now a section — changing it forks the Meta event history. Wrap **exactly those seven** and no others; adding `why-choose`/`prelaunch` "since they're broken anyway" changes event volume and makes any before/after ad read uninterpretable. Note the intent in a comment; add them in a separate dated change if wanted.

Section `id`s must stay on the `<section>` elements — `CourseNav` links to all seven anchors and they may be in ad creative. Add `scroll-mt-*` for the sticky-nav offset.

### Phase 9 — Analytics parity pass

Meta Pixel Helper + GA4 DebugView on a preview deploy with a `NEXT_PUBLIC_ANALYTICS_MODE=debug` escape hatch (gate on `VERCEL_ENV`, not the PHP's `STAGE` — otherwise you cannot verify pixel parity on a preview, which is exactly when you need to). Walk the course page and tick off all five event types and all seven `ViewContent` names. Restore the `<noscript>` pixel `<img>`.

### Phase 10 — Cutover

Point DNS at Vercel; keep the PHP host reachable at `old.houndawayfromhome.com` for 48h for diffing; run `check-redirects.mjs` against production; resubmit the sitemap in Search Console; watch Coverage for two weeks. Then delete `hafh-web`.

---

## Not ported

`redirect.php` (the maintenance gate), `development.html`, `includes/devserver.php`, `includes/debug.php` (the breakpoint indicator — devtools does this), `admin/updatesite.php` (Vercel deploys on push), `#comingSoonModal`, Inter, the 4 unused Gilroy weights + 13 unused italic/extra TTFs, the 8.2MB of `learn_*.png`, `paws{,1,2,3}.png`, `course-thumbnail.png`, `logo-640x640.png`, `logo-32x32.png`, the 0-byte `favicon.gif`, `styles/sass/`, `vendor/`, `_archive/` (32MB of zips), all `.DS_Store`.

**The 10.5MB `hound_away_from_home_business_ebook.pdf`** is referenced by nothing in the entire tree, and we're keeping the current ebook behavior (no automated send), so it stays out of the repo. Keep it in Blob or locally for manual follow-up rather than committing a 10.5MB binary into a fresh repo's history.

**Deferred:** re-exporting the oversized favicons (23–39KB for 144–180px icons; `mstile-150x150.png` is actually 270×270), fleshing out `/services` (a two-sentence stub, not in the sitemap today — preserve that), dark mode (don't).

---

## Top risks

1. **Email deliverability — by a wide margin the top risk.** Moving off the host's SMTP relay to Resend changes sending-domain reputation. Misconfigured SPF/DKIM/DMARC means contact-form leads stop arriving **silently** — no error, no visible bounce. This is the booking funnel for a real business. Mitigate: verify the domain properly (started in Phase 0), test with mail-tester, send to Gmail/Outlook/iCloud, and **persist every submission to Blob so a delivery failure is recoverable rather than fatal**.
2. **`.php` redirect completeness** — a miss is a silent 404 on an indexed URL with possible ad spend behind it. Fully mitigated by Phase 2's script, which is why it's Phase 2.
3. **fbq event parity** — Meta's optimizer runs on Lead/ViewContent volume. Silent breakage degrades ad performance over days with zero error signal. Mitigated by the typed facade, the debug escape hatch, and Phase 9.
4. **Bootstrap-CSS-dependent form chrome** (Phase 5) — the most tedious hand-work in the project, with no shadcn equivalent.
5. **Private Blob + OIDC in practice** — prove it in Phase 0 before Phase 4 depends on it.
6. **The malformed course-page HTML** — diff the live DOM, not the source.
7. **Course page LCP** — should improve enormously, but the GIF→video conversion is where autoplay quirks can produce a static gray box on the highest-value page.

## Verification summary

- `npm run build` clean; `tsc --noEmit` clean.
- `node scripts/check-redirects.mjs --base <url>` green against preview **and** production.
- Screenshot diff every page at 375/768/1440 against production (or `old.houndawayfromhome.com` post-cutover).
- Contact form: real inbox delivery with correct `reply-to`; honeypot rejected; bad token rejected; Blob record survives a forced email failure.
- Newsletter + both lead magnets: HubSpot contact created, Blob record written, correct redirect destination.
- `/admin/leads`: Basic auth challenges, renders both lists, and the raw blob URL **403s anonymously**.
- Quiz: 21 option paths, 3 branches with gate precedence, Back/Forward, `?question=N` deep links, gate not URL-bypassable.
- Course page: accordion individual + expand-all, read-more, 7 enroll buttons → correct Kajabi URL, `?offer=` allowlist rejects unknown values, all 5 fbq event types + all 7 `ViewContent` names, videos autoplay on iOS and respect `prefers-reduced-motion`.
- Lighthouse on `/` and `/at-home-dog-boarding-course` — expect a large LCP/weight win on the latter.
