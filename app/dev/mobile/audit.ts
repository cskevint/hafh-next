/**
 * Automated mobile checks, run from the PARENT window against the preview
 * iframe's window.
 *
 * Two constraints shape everything here:
 *
 * 1. CROSS-REALM. The elements belong to the iframe's JS realm, so
 *    `el instanceof HTMLElement` is FALSE even for genuine elements — each
 *    realm has its own constructors. Nothing below uses `instanceof`, and every
 *    computed style comes from the frame's own `win.getComputedStyle`.
 *
 * 2. TEXT-FIRST OUTPUT. The point of this module is that mobile defects get
 *    reported as measurements rather than left to be eyeballed in a screenshot.
 *    `formatReport` renders to plain text so it can be read out of the page
 *    body or the console without a picture.
 */

/** Apple HIG minimum touch target. WCAG 2.2 AA (SC 2.5.8) sets a lower 24px
 * floor, so anything under that is escalated from warning to critical. */
const TAP_TARGET_MIN = 44;
const TAP_TARGET_CRITICAL = 24;

/** Under 16px, iOS Safari zooms the whole page when the field takes focus and
 * does not zoom back out. The single most common "the form feels broken on my
 * phone" cause. */
const INPUT_MIN_FONT = 16;

const TEXT_MIN_FONT = 12;

/** Scrollbars and subpixel rounding make exact comparisons noisy. */
const SLOP = 1;

/** Long lists are noise — a page with 80 small tap targets has one systemic
 * problem, not 80 problems. */
const MAX_PER_CHECK = 15;

const INTERACTIVE =
  'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [tabindex]:not([tabindex="-1"])';

const TEXT_INPUTS =
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]):not([type="range"]), select, textarea';

export type Severity = "critical" | "warning";

export type Finding = {
  severity: Severity;
  selector: string;
  detail: string;
};

export type AuditReport = {
  url: string;
  title: string;
  viewportWidth: number;
  viewportHeight: number;
  scrollWidth: number;
  scrollHeight: number;
  hasViewportMeta: boolean;
  horizontalOverflow: boolean;
  checks: { name: string; findings: Finding[]; truncated: number }[];
};

/* -------------------------------------------------------------------------
 * Element description helpers
 * ---------------------------------------------------------------------- */

/** Tailwind class lists are enormous and mostly noise in a selector. Keep the
 * first couple of short, plain classes — enough to recognise the element in
 * source without printing 400 characters of utilities. */
function describe(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const classes = Array.from(el.classList)
    .filter((c) => c.length <= 20 && !c.includes(":") && !c.includes("["))
    .slice(0, 2)
    .map((c) => `.${c}`)
    .join("");
  return `${tag}${id}${classes}`;
}

function selectorFor(el: Element): string {
  const parts = [describe(el)];
  let cur = el.parentElement;
  for (let i = 0; i < 2 && cur && cur.tagName !== "BODY"; i += 1) {
    parts.unshift(describe(cur));
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}

function textOf(el: Element, max = 44): string {
  const raw =
    el.getAttribute("aria-label") ??
    el.getAttribute("alt") ??
    el.getAttribute("placeholder") ??
    el.textContent ??
    "";
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return "(no accessible text)";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function isVisible(win: Window, el: Element): boolean {
  const s = win.getComputedStyle(el);
  if (s.display === "none" || s.visibility === "hidden") return false;
  if (Number(s.opacity) === 0) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/** An element that pokes past the viewport under an `overflow-x: hidden`
 * ancestor is clipped, not a bug — that is the standard way to hide a
 * decorative bleed. Only unclipped overflow can actually scroll the page. */
function clippedByAncestor(win: Window, el: Element): boolean {
  let cur = el.parentElement;
  while (cur) {
    const ox = win.getComputedStyle(cur).overflowX;
    if (ox !== "visible") return true;
    cur = cur.parentElement;
  }
  return false;
}

function take(findings: Finding[]): { findings: Finding[]; truncated: number } {
  const order: Record<Severity, number> = { critical: 0, warning: 1 };
  const sorted = [...findings].sort(
    (a, b) => order[a.severity] - order[b.severity],
  );
  return {
    findings: sorted.slice(0, MAX_PER_CHECK),
    truncated: Math.max(0, sorted.length - MAX_PER_CHECK),
  };
}

/* -------------------------------------------------------------------------
 * Checks
 * ---------------------------------------------------------------------- */

function checkHorizontalOverflow(win: Window, clientWidth: number): Finding[] {
  const doc = win.document;
  const findings: Finding[] = [];
  /* Only hunt for offenders when the document genuinely scrolls sideways.
   * Otherwise every `-mx-4` bleed inside a clipped parent reports as a bug. */
  if (doc.documentElement.scrollWidth <= clientWidth + SLOP) return findings;

  const reported: Element[] = [];
  for (const el of Array.from(doc.body.querySelectorAll("*"))) {
    if (!isVisible(win, el)) continue;
    const r = el.getBoundingClientRect();
    const overRight = r.right - clientWidth;
    const overLeft = -r.left;
    if (overRight <= SLOP && overLeft <= SLOP) continue;
    if (clippedByAncestor(win, el)) continue;
    /* Report the outermost offender only; its children all inherit the same
     * overflow and would triple the list length for one root cause. */
    if (reported.some((p) => p.contains(el))) continue;
    reported.push(el);

    const by = Math.round(Math.max(overRight, overLeft));
    const side = overRight > overLeft ? "right" : "left";
    findings.push({
      severity: "critical",
      selector: selectorFor(el),
      detail: `overflows ${side} by ${by}px (spans x=${Math.round(r.left)}→${Math.round(r.right)}, viewport 0→${clientWidth}) — "${textOf(el, 28)}"`,
    });
  }
  return findings;
}

/**
 * The rect a finger actually has to hit, which is not always the control's own
 * box. A `sr-only` radio is 1×1px, but the `<label>` wrapping it is a full-size
 * pill and tapping anywhere on that pill activates the input — reporting the
 * 1×1 would be crying wolf, and an audit that cries wolf gets ignored.
 */
function effectiveTarget(win: Window, el: Element): DOMRect {
  const own = el.getBoundingClientRect();
  const tag = el.tagName;
  if (tag !== "INPUT" && tag !== "SELECT" && tag !== "TEXTAREA") return own;

  const label =
    el.closest("label") ??
    (el.id
      ? win.document.querySelector(
          `label[for="${CSS.escape(el.id)}"]`,
        )
      : null);
  if (!label || !isVisible(win, label)) return own;

  const lr = label.getBoundingClientRect();
  return lr.width * lr.height > own.width * own.height ? lr : own;
}

function checkTapTargets(win: Window): Finding[] {
  const findings: Finding[] = [];
  for (const el of Array.from(win.document.querySelectorAll(INTERACTIVE))) {
    if (!isVisible(win, el)) continue;
    const r = effectiveTarget(win, el);
    if (r.width >= TAP_TARGET_MIN && r.height >= TAP_TARGET_MIN) continue;

    /* A small icon inside a big <a> is fine — the anchor is what gets tapped. */
    const outer = el.parentElement?.closest(INTERACTIVE);
    if (outer) {
      const pr = outer.getBoundingClientRect();
      if (pr.width >= TAP_TARGET_MIN && pr.height >= TAP_TARGET_MIN) continue;
    }

    const smallest = Math.min(r.width, r.height);
    findings.push({
      severity: smallest < TAP_TARGET_CRITICAL ? "critical" : "warning",
      selector: selectorFor(el),
      detail: `${Math.round(r.width)}×${Math.round(r.height)}px (min ${TAP_TARGET_MIN}) — "${textOf(el)}"`,
    });
  }
  return findings;
}

function checkInputFontSize(win: Window): Finding[] {
  const findings: Finding[] = [];
  for (const el of Array.from(win.document.querySelectorAll(TEXT_INPUTS))) {
    if (!isVisible(win, el)) continue;
    const fs = Number.parseFloat(win.getComputedStyle(el).fontSize);
    if (!Number.isFinite(fs) || fs >= INPUT_MIN_FONT) continue;
    findings.push({
      severity: "critical",
      selector: selectorFor(el),
      detail: `font-size ${fs}px (< ${INPUT_MIN_FONT}) — iOS Safari zooms the page on focus. "${textOf(el)}"`,
    });
  }
  return findings;
}

function checkTinyText(win: Window): Finding[] {
  const doc = win.document;
  const findings: Finding[] = [];
  const seen = new Set<Element>();
  /* 4 === NodeFilter.SHOW_TEXT, written as a literal because NodeFilter is a
   * per-realm global and this code runs in the parent realm. */
  const walker = doc.createTreeWalker(doc.body, 4);
  while (walker.nextNode()) {
    const parent = walker.currentNode.parentElement;
    if (!parent || seen.has(parent)) continue;
    if (!walker.currentNode.nodeValue?.trim()) continue;
    seen.add(parent);
    if (!isVisible(win, parent)) continue;
    const fs = Number.parseFloat(win.getComputedStyle(parent).fontSize);
    if (!Number.isFinite(fs) || fs >= TEXT_MIN_FONT) continue;
    findings.push({
      severity: "warning",
      selector: selectorFor(parent),
      detail: `font-size ${fs}px (< ${TEXT_MIN_FONT}) — "${textOf(parent)}"`,
    });
  }
  return findings;
}

function checkImages(win: Window, clientWidth: number): Finding[] {
  const findings: Finding[] = [];
  for (const el of Array.from(win.document.querySelectorAll("img"))) {
    if (!isVisible(win, el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width > clientWidth + SLOP) {
      findings.push({
        severity: "critical",
        selector: selectorFor(el),
        detail: `renders ${Math.round(r.width)}px wide in a ${clientWidth}px viewport — "${textOf(el, 28)}"`,
      });
    }
    /* alt="" is a valid decorative marker; a missing attribute is not. */
    if (el.getAttribute("alt") === null) {
      findings.push({
        severity: "warning",
        selector: selectorFor(el),
        detail: `missing alt attribute (src ${el.getAttribute("src")?.slice(0, 48) ?? "?"})`,
      });
    }
  }
  return findings;
}

/* -------------------------------------------------------------------------
 * Entry point
 * ---------------------------------------------------------------------- */

export function auditFrame(win: Window): AuditReport {
  const doc = win.document;
  const clientWidth = doc.documentElement.clientWidth;

  const checks: AuditReport["checks"] = [
    { name: "Horizontal overflow", ...take(checkHorizontalOverflow(win, clientWidth)) },
    { name: "Tap targets", ...take(checkTapTargets(win)) },
    { name: "Input font size", ...take(checkInputFontSize(win)) },
    { name: "Tiny text", ...take(checkTinyText(win)) },
    { name: "Images", ...take(checkImages(win, clientWidth)) },
  ];

  return {
    url: win.location.pathname + win.location.search,
    title: doc.title,
    viewportWidth: clientWidth,
    viewportHeight: doc.documentElement.clientHeight,
    scrollWidth: doc.documentElement.scrollWidth,
    scrollHeight: doc.documentElement.scrollHeight,
    hasViewportMeta: !!doc.querySelector('meta[name="viewport"]'),
    horizontalOverflow:
      doc.documentElement.scrollWidth > clientWidth + SLOP,
    checks,
  };
}

export function countBySeverity(report: AuditReport): {
  critical: number;
  warning: number;
} {
  let critical = 0;
  let warning = 0;
  for (const c of report.checks) {
    for (const f of c.findings) {
      if (f.severity === "critical") critical += 1;
      else warning += 1;
    }
  }
  return { critical, warning };
}

export function formatReport(report: AuditReport): string {
  const { critical, warning } = countBySeverity(report);
  const lines: string[] = [];

  lines.push(`PAGE      ${report.url}  —  ${report.title}`);
  lines.push(
    `VIEWPORT  ${report.viewportWidth}×${report.viewportHeight}   CONTENT ${report.scrollWidth}×${report.scrollHeight}`,
  );
  lines.push(
    `RESULT    ${critical} critical, ${warning} warning` +
      (report.horizontalOverflow
        ? `   ⚠ PAGE SCROLLS SIDEWAYS (${report.scrollWidth - report.viewportWidth}px)`
        : "   no horizontal scroll"),
  );
  if (!report.hasViewportMeta) {
    lines.push(`CRITICAL  no <meta name="viewport"> — the page will not scale`);
  }
  lines.push("");

  for (const check of report.checks) {
    if (check.findings.length === 0) {
      lines.push(`✓ ${check.name}: clean`);
      continue;
    }
    lines.push(`✗ ${check.name}: ${check.findings.length + check.truncated}`);
    for (const f of check.findings) {
      lines.push(`    [${f.severity}] ${f.selector}`);
      lines.push(`        ${f.detail}`);
    }
    if (check.truncated > 0) {
      lines.push(`    …and ${check.truncated} more (same check)`);
    }
  }
  return lines.join("\n");
}
