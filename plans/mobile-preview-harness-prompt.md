# Prompt: build a mobile preview harness and review the site on it

Paste everything below the line into a fresh session on a Next.js App Router project.
It is written to be run by an agent that has a browser-automation tool (Claude in Chrome,
Playwright MCP, or similar) able to navigate a URL, screenshot, and run JavaScript in the
page.

---

I want to review how this site looks and behaves on a phone, and I want you to be able to
review your own changes. Resizing the real browser window does not work reliably in this
setup, so do not try it.

Build a dev-only preview harness that renders the real site inside a device-sized
**iframe**, then use it to review every page.

## Why an iframe, and not a "mobile mode" container

The obvious approach — a `?mobile=1` flag that wraps the app in a 390px-wide div — is
wrong for any site styled with CSS media queries (Tailwind's `sm:` / `md:` / `lg:`,
Bootstrap's grid, plain `@media` rules). **Media queries resolve against the viewport, not
against a parent element's width.** Inside a narrow container every desktop branch stays
active: the desktop nav stays visible, the hamburger stays hidden, multi-column grids stay
multi-column. Every screenshot would look plausible and be wrong.

An iframe has a viewport of its own. At `width: 393px` the frame genuinely evaluates
`min-width: 1024px` as false and the mobile branch renders for real.

**Check this before you trust anything else.** Load the harness at `w=1280` and confirm
the desktop nav renders; switch to `w=393` and confirm it collapses to a hamburger. If
that flip does not happen, the harness is not working and every finding after it is
worthless — stop and fix it.

(A container-query-based site is the exception; there, container width genuinely does
drive layout. Check which the project uses before you start.)

## Before you build

1. Grep for `Content-Security-Policy`, `frame-ancestors`, and `X-Frame-Options` in the
   Next config, middleware/proxy, and any host config. If the site sets any of them,
   same-origin framing may be blocked and you must relax it for dev before continuing.
2. Find the project's canonical route list (a routes module, the sitemap source, a nav
   constant) and drive the harness's page picker from it. Do not hand-maintain a second
   list that can drift.
3. Note whether the site uses `100vh` / `dvh` anywhere — those are the cases the harness
   approximates worst.

## What to build

**`app/dev/mobile/page.tsx`** — server component.
- `if (process.env.NODE_ENV === "production") notFound();` as the first statement. This
  guard is what lets the harness live in the repo permanently: it cannot be reached on a
  deploy, so it needs no auth.
- `robots: { index: false, follow: false }` in metadata.
- `await searchParams` (a Promise in Next 15+) and pass the initial values down.
- Validate `path`: accept only same-origin absolute paths (`startsWith("/")` and not
  `//`), else fall back to `/`. An open frame target is a phishing-shaped demo.
- Place it outside any route group so it inherits only the root layout and renders no
  site chrome of its own.

**`app/dev/mobile/MobilePreview.tsx`** — `"use client"`.
- Page picker from the canonical route list; drop anything auth-gated.
- Device presets — iPhone SE 375×667, iPhone 15 393×852, iPhone 15 Pro Max 430×932,
  Pixel 8 412×915, iPad mini 744×1133 — plus free width/height inputs and a **desktop
  control (1280×800)**, which is what you use for the media-query proof above.
- The frame renders at exactly w×h with **no CSS transform**, so screenshots are
  pixel-true.
- **Fold stepping**: buttons that call
  `iframe.contentWindow.scrollTo({ top: fold * (height - 64), behavior: "instant" })`,
  with a `3 / 7` counter derived from the frame's `scrollHeight`. A 64px overlap means
  nothing is lost across a screenshot seam. This is how you capture a long page as a
  sequence of true phone screens.
- **Put all state in the URL** — `?path=&w=&h=&mode=&fold=` — synced with
  `window.history.replaceState`, *not* the router. This is the single most important
  design decision: it means you capture each screenshot with one navigation instead of a
  brittle click sequence. Using the router instead would re-render the server component,
  reload the frame, and discard the scroll position you just set.
- **Poll `iframe.contentWindow.document.readyState`; do not rely on the iframe's `load`
  event.** On a server-rendered page the browser starts fetching the frame from the
  initial HTML and often finishes *before* React hydrates and attaches `onLoad`. That
  handler then never fires and the harness hangs on "waiting". Also require
  `contentWindow.location.pathname === path` before measuring, or a path change will
  audit the previous document; give up after ~4s so a redirect cannot wedge it.
- Re-measure and re-audit after a ~700ms settle delay — fonts and images reflow after
  `readyState === "complete"` and the first numbers are not trustworthy.

**`app/dev/mobile/audit.ts`** — automated checks the parent runs against
`iframe.contentWindow`. This is what turns the review from eyeballing into measurement.

Two hard constraints:
- **Cross-realm.** The frame's elements come from a different JS realm, so
  `el instanceof HTMLElement` is `false` even for real elements. Use no `instanceof`, and
  take computed styles from the frame's own `win.getComputedStyle`.
- **Text-first output.** Render the report as plain text in the page *and*
  `console.log` it as JSON, so you can read findings without a screenshot.

Checks, in value order:
1. **Horizontal overflow.** `documentElement.scrollWidth > clientWidth`, then the
   outermost offending elements. Two filters keep it honest: skip anything clipped by an
   ancestor with `overflow-x` other than `visible` (an intentional bleed is not a bug),
   and report only the outermost offender (children inherit the same overflow).
2. **Tap targets** under 44×44 CSS px (Apple HIG); escalate under 24px (WCAG 2.2 SC
   2.5.8). Skip a small control inside a large interactive ancestor. **Critically**:
   resolve an input's *effective* target through its `<label>` — a `sr-only` radio is
   1×1px but its label is a full-size pill, and reporting the 1×1 is crying wolf. An
   audit that cries wolf gets ignored.
3. **Input font size under 16px** — iOS Safari zooms the page on focus and does not zoom
   back. The most common "your form is broken on my phone" cause.
4. **Text under 12px.**
5. **Images** rendering wider than the viewport, or missing an `alt` attribute (`alt=""`
   is a valid decorative marker; a missing attribute is not).
6. **Missing `<meta name="viewport">`.**

Cap each check at ~15 findings and say how many were suppressed — a page with 80 small
tap targets has one systemic problem, not 80.

## How to review with it

1. Start the dev server. If you hit a bundler panic or a page that reload-loops, delete
   the build cache (`.next`) and restart before debugging your own code — a stale cache
   presents as your bug.
2. **Audit pass**, at 375 (narrowest realistic width): visit every route, read the text
   report. Site-wide header/footer findings will repeat on every page — collapse them
   into one entry rather than reporting them N times.
3. **Visual pass**, at 393: step every page through its folds and screenshot each one.
4. **Interaction passes** — the audit only sees the DOM as it currently stands, so
   anything behind an interaction is invisible until you open it. Drive these by running
   JS inside the frame (`iframe.contentDocument.querySelector(...).click()`), which is far
   more reliable than clicking through coordinates, then press re-audit:
   - the mobile nav drawer
   - every form, including its error states
   - accordions, tabs, quizzes, carousels — each state
5. **Measure what screenshots cannot show.** Query the frame's DOM directly for
   structural facts: total page height in phone-screens, the scroll offset of every
   CTA, whether a nav is `position: sticky`. "The last CTA is at 10,200px of a 16,200px
   page" is a finding no screenshot will ever hand you.

## Report honestly

State these limitations alongside the findings — do not let the harness be mistaken for a
device lab:

- **Width only.** No touch input, no mobile user-agent, desktop device-pixel-ratio.
- **Hover lies.** `@media (hover: hover)` still matches inside the frame, so `hover:`
  styles render here that a phone will never show. Anything that depends on hover to be
  discoverable must be caught by reading the source, not by screenshot.
- **No dynamic viewport.** iOS Safari's collapsing URL bar is not reproduced, so `100vh`
  and `dvh` behaviour is approximate.
- A real device remains the final word. This catches layout defects, not platform quirks.

Group findings by severity and by whether they are site-wide or page-specific. Give each
one a concrete fix. Do not change production code unless I ask — deliver the report first.
