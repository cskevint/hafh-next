#!/usr/bin/env node
/**
 * One-shot generator: scrapes the LIVE course page and writes
 * content/course/generated.ts.
 *
 * Why scrape the live DOM rather than parse at-home-dog-boarding-course.php:
 * the PHP holds this copy in ~10 arrays interpolated through heredoc helpers,
 * AND has three malformed-HTML regions the browser silently repairs. The
 * rendered DOM is the ground truth for what visitors actually see.
 *
 * Run once, review the output, then commit the generated file and treat it as
 * hand-maintained content. This script is kept for provenance and for re-running
 * if the PHP site changes before cutover.
 *
 *   node scripts/extract-course-content.mjs
 */
import { writeFileSync } from "node:fs";

const URL_ = "https://www.houndawayfromhome.com/at-home-dog-boarding-course";

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&rdquo;": "”",
  "&ldquo;": "“",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
};

function decode(str) {
  let out = str;
  for (const [k, v] of Object.entries(ENTITIES)) out = out.split(k).join(v);
  // Numeric entities, including emoji.
  out = out.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  out = out.replace(/&#x([0-9a-f]+);/gi, (_, n) =>
    String.fromCodePoint(parseInt(n, 16)),
  );
  return out;
}

/** Strip tags, decode entities, collapse whitespace. */
function text(html) {
  return decode(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function slice(html, startRe, endRe, from = 0) {
  const s = html.slice(from).search(startRe);
  if (s === -1) return null;
  const abs = from + s;
  const e = html.slice(abs + 1).search(endRe);
  return { start: abs, end: e === -1 ? html.length : abs + 1 + e };
}

const html = await fetch(URL_).then((r) => r.text());

// ---------------------------------------------------------------- outline
function extractOutline() {
  const region = slice(html, /id="courseOutline"/, /<\/section>/);
  const block = html.slice(region.start, region.end);
  const cards = block.split(/<div class="card"/).slice(1);
  const days = [];
  for (const card of cards) {
    const idM = card.match(/id="(day\d+)-button"/);
    const titleM = card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    if (!idM || !titleM) continue;
    const lessons = [];
    const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/g;
    let m;
    while ((m = re.exec(card)) !== null) {
      lessons.push({ title: text(m[1]), description: text(m[2]) });
    }
    days.push({ id: idM[1], title: text(titleM[1]), lessons });
  }
  return days;
}

// ------------------------------------------------------------------- faqs
function extractFaqs() {
  const region = slice(html, /id="faqs"/, /<\/section>/);
  const block = html.slice(region.start, region.end);
  const cards = block.split(/<div class="rounded-4 p-4 border border-info">/).slice(1);
  const faqs = [];
  for (const card of cards) {
    const iconM = card.match(/class="bi bi-([a-z-]+)/);
    const qM = card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    const aM = card.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (!qM || !aM) continue;
    faqs.push({
      icon: iconM ? iconM[1] : "person",
      question: text(qM[1]),
      answer: text(aM[1]),
    });
  }
  return faqs;
}

// ------------------------------------------------------------ disclaimers
function extractDisclaimers() {
  const region = slice(html, /id="disclaimer"/, /<\/section>/);
  const block = html.slice(region.start, region.end);
  const out = [];
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    out.push({ title: text(m[1]), body: text(m[2]) });
  }
  return out;
}

// --------------------------------------------------------------- audience
function extractAudience() {
  const region = slice(html, /id="audience"/, /<\/section>/);
  const block = html.slice(region.start, region.end);
  const lists = [...block.matchAll(/<ul class="(blue|brown)-checkmark-list[^"]*">([\s\S]*?)<\/ul>/g)];
  const pick = (kind) => {
    const found = lists.find((l) => l[1] === kind);
    if (!found) return [];
    return [...found[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => text(m[1]));
  };
  return { whoFor: pick("blue"), whoNotFor: pick("brown") };
}

// ----------------------------------------------------------- what you'll learn
function extractLearn() {
  const region = slice(html, /id="learn"/, /<\/section>/);
  const block = html.slice(region.start, region.end);
  const rows = [];
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>[\s\S]*?<ul class="checkmark-list[^"]*">([\s\S]*?)<\/ul>/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    rows.push({
      title: text(m[1]),
      bullets: [...m[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((x) => text(x[1])),
    });
  }
  return rows;
}

// ----------------------------------------------------------- testimonials
function extractTestimonials() {
  const region = slice(html, /id="testimonials"/, /<\/section>/);
  const block = html.slice(region.start, region.end);
  const out = [];
  // Quote, then avatar, then name and role — in that DOM order.
  const re =
    /<p class="[^"]*fst-italic[^"]*"[^>]*>([\s\S]*?)<\/p>[\s\S]*?testimonial_(\w+)\.jpg[\s\S]*?<p class="m-0 fs-5">([\s\S]*?)<\/p>\s*<p class="text-primary">([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    const rawQuote = m[1];
    // Cards 2 and 3 use the read-more pattern: visible text, then a "More..."
    // link, then the continuation inside .read-more-content. Split them so the
    // ReadMore component can reproduce the toggle.
    let quote = rawQuote;
    let more;
    const splitAt = rawQuote.indexOf('<span class="read-more');
    if (splitAt !== -1) {
      quote = rawQuote.slice(0, splitAt);
      const contM = rawQuote.match(
        /class="read-more-content"[^>]*>([\s\S]*?)<\/span>/,
      );
      if (contM) more = text(contM[1]);
    }
    out.push({
      avatar: `/images/course/testimonial_${m[2]}.jpg`,
      quote: text(quote),
      ...(more ? { more } : {}),
      name: text(m[3]),
      role: text(m[4]),
    });
  }
  return out;
}

// -------------------------------------------------------------- infoboxes
function extractInfoboxes() {
  const region = slice(html, /id="why-choose"/, /<\/section>/);
  const block = html.slice(region.start, region.end);
  // The box caption is an <h3>, not a <p>.
  return [...block.matchAll(/box_(\w+)\.png[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => ({
    image: m[1],
    text: text(m[2]),
  }));
}

// ------------------------------------------------------------------ coach
function extractCoach() {
  const region = slice(html, /id="coach"/, /<\/section>/);
  const block = html.slice(region.start, region.end);
  return [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => text(m[1]))
    .filter((t) => t.length > 40);
}

const data = {
  outline: extractOutline(),
  faqs: extractFaqs(),
  disclaimers: extractDisclaimers(),
  audience: extractAudience(),
  learn: extractLearn(),
  testimonials: extractTestimonials(),
  infoboxes: extractInfoboxes(),
  coach: extractCoach(),
};

// ------------------------------------------------------------ sanity checks
const lessonCount = data.outline.reduce((n, d) => n + d.lessons.length, 0);
const report = [
  `days:         ${data.outline.length} (expect 9)`,
  `lessons:      ${lessonCount} (expect 52)`,
  `faqs:         ${data.faqs.length} (expect 16)`,
  `disclaimers:  ${data.disclaimers.length} (expect 6)`,
  `whoFor:       ${data.audience.whoFor.length} (expect 7)`,
  `whoNotFor:    ${data.audience.whoNotFor.length} (expect 7)`,
  `learn rows:   ${data.learn.length} (expect 3)`,
  `testimonials: ${data.testimonials.length} (expect 3)`,
  `infoboxes:    ${data.infoboxes.length} (expect 5)`,
  `coach paras:  ${data.coach.length} (expect 3)`,
];
console.log(report.join("\n"));

const header = `/**
 * GENERATED by scripts/extract-course-content.mjs from the live course page.
 *
 * Scraped from the rendered DOM rather than transcribed from
 * at-home-dog-boarding-course.php, because that file holds this copy in ~10
 * PHP arrays interpolated through heredoc helpers AND contains three malformed
 * HTML regions the browser silently repairs. The DOM is what visitors see.
 *
 * Treat as hand-maintained content from here on: edit this file directly.
 */
`;

const body = Object.entries(data)
  .map(([key, value]) => `export const ${key} = ${JSON.stringify(value, null, 2)} as const;`)
  .join("\n\n");

writeFileSync("content/course/generated.ts", `${header}\n${body}\n`);
console.log("\nwrote content/course/generated.ts");
