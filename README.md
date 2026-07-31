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
cp .env.example .env.local   # fill in what you need; see below
npm run dev
```

The app **builds and runs with no environment variables at all** — every
integration degrades gracefully. The catch is that the lead flows will *look*
like they work while quietly storing and sending nothing, so don't read anything
into a success message until the vars below are set.

## Environment variables

Set these in Vercel → Project → Settings → Environment Variables (and in
`.env.local` for local work).

### Required for the site to actually function

| Variable | Used by | If missing |
|---|---|---|
| `RESEND_API_KEY` | contact + lead-capture notifications | **No email is sent.** Logs a warning; the visitor still sees a success message |
| `MAIL_FROM` | sender address, e.g. `Hound Away From Home <noreply@houndawayfromhome.com>` | No email is sent. Must be a **verified Resend domain** or delivery fails silently |
| `CONTACT_US_EMAIL` | recipient for every form submission | No email is sent |
| `BLOB_READ_WRITE_TOKEN` | lead storage + `/admin/leads` | **No leads are persisted.** Not needed on Vercel — auth there is an auto-rotating OIDC token. Locally, get one with `vercel env pull` |
| `ADMIN_PASSWORD` | `/admin/leads` (HTTP Basic, any username) | **`/admin/leads` returns 401 for everyone.** This is the one variable that *fails closed*, deliberately — an admin page rendering customer PII must never be world-readable by default |

### Strongly recommended

| Variable | Used by | If missing |
|---|---|---|
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | contact form, client side | Token is never minted |
| `RECAPTCHA_SECRET_KEY` | contact form, server side | **Bot check is skipped entirely** (logs a warning). Honeypot and zod validation still apply |
| `HUBSPOT_API_TOKEN` | ebook / guide / quiz capture | Contact upsert is a no-op — matching the PHP's behavior when its token was unset |

### Analytics

Both IDs were already public in the shipped PHP `<head>`; they are not secrets.

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_GA_ID` | `G-FRD4XKQCPT`. Script is skipped if unset |
| `NEXT_PUBLIC_FB_PIXEL_ID` | `1217184416699830`. Script is skipped if unset |
| `NEXT_PUBLIC_ANALYTICS_MODE` | Set to `debug` to force analytics **on** in a preview deploy for parity checking |

> **Analytics fire on production deployments only.** The gate is
> `NEXT_PUBLIC_VERCEL_ENV === "production"`, which Vercel sets automatically. A
> production deploy — even on a `*.vercel.app` URL, before DNS is pointed — will
> send **real** GA4 and Meta Pixel events and pollute your reporting. To test
> without that, deploy to a preview branch, or leave both IDs empty until
> cutover.

### Optional tuning

| Variable | Default | Notes |
|---|---|---|
| `RECAPTCHA_MIN_SCORE` | `0.5` | v3 score threshold. The PHP checked only `success`, which is true for any valid token regardless of score — so it had no real bot protection |
| `SPAM_SUBSTRINGS` | `serviseantilogin` | Comma-separated. Seeded with the one string the PHP hardcoded |
| `EMAIL_DISALLOW_LIST` | empty | Comma-separated addresses to silently reject |

> `.env.example` also lists `CONTACT_US_NAME`, which no code reads — a leftover.
> Safe to ignore or delete.

## Email — two separate systems

Outbound and inbound mail are handled by different providers. Easy to conflate
when debugging; they share nothing but the domain.

**Outbound (app → you) — [Resend](https://resend.com).** Every form
notification goes through `lib/email/index.ts` using `RESEND_API_KEY` and
`MAIL_FROM`. Domain verification lives in DNS:

| Record | Purpose |
|---|---|
| `resend._domainkey` TXT | DKIM signing key |
| `send.houndawayfromhome.com` MX | bounce handling, → Amazon SES |
| `send.houndawayfromhome.com` TXT | `v=spf1 include:amazonses.com ~all` |

The dedicated `send.` subdomain is load-bearing — it keeps Resend's MX record
from colliding with the inbound forwarding below. Don't "simplify" it onto the
root domain.

**Inbound (anyone → the domain) — [ImprovMX](https://improvmx.com).**
Forwarding only, no mailboxes: root `MX` → `mx1/mx2.improvmx.com`, with
`include:spf.improvmx.com` in the root SPF record. If `CONTACT_US_EMAIL` is an
`@houndawayfromhome.com` address, form notifications reach you *through*
ImprovMX — so a broken forward looks exactly like a broken send.

DNS for all of the above is served by the registrar's nameservers
(`dns1/dns2.registrar-servers.com`). The legacy DreamHost zone does **not**
carry the Resend or ImprovMX records; don't re-point nameservers at it.

## Scripts

| command | what it does |
|---|---|
| `npm run dev` | dev server (Turbopack) |
| `npm run build` | production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | eslint — **`next build` no longer runs lint in Next 16**, so CI must call this |

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

`content/course/generated.ts` was originally scraped from the rendered DOM of the
legacy PHP course page (the PHP built that copy from ~10 arrays through heredoc
helpers, so the DOM was the only reliable source). It is hand-maintained now —
edit it directly.

## Things that will bite you

- **`lib/routes.ts` is the single source** for redirects, the sitemap, and
  robots. Change URLs there, nowhere else. Both `/faqs` and `/faqs.php` have
  been indexed for years (Apache rewrote extensionless paths to `.php`), so
  every legacy `.php` URL needs its redirect — dropping one is a silent 404 on
  an indexed, possibly ad-targeted URL. Nothing checks this automatically.
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
