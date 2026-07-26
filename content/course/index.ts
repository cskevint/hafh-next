import {
  BookOpen,
  CircleHelp,
  Clock,
  Coins,
  DollarSign,
  House,
  Monitor,
  PersonStanding,
  Plane,
  Receipt,
  ShoppingCart,
  Tag,
  TreePine,
  User,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export * from "./generated";

/**
 * bootstrap-icons -> lucide mapping for the 16 course FAQ icons.
 *
 * The PHP pulled the entire bootstrap-icons webfont from jsDelivr — a
 * render-blocking cross-origin stylesheet plus a font download — to draw about
 * 28 glyphs. lucide is tree-shaken and needs no network request.
 *
 * Keys are the bi-* slugs as they appear in the scraped markup. Unknown slugs
 * fall back to CircleHelp rather than rendering nothing, which is what a
 * missing webfont glyph would have done silently.
 */
const ICONS: Record<string, LucideIcon> = {
  person: User,
  "cart-fill": ShoppingCart,
  "house-door-fill": House,
  "clock-fill": Clock,
  "tag-fill": Tag,
  "book-fill": BookOpen,
  "display-fill": Monitor,
  "currency-dollar": DollarSign,
  "tree-fill": TreePine,
  "person-walking": PersonStanding,
  tools: Wrench,
  receipt: Receipt,
  "airplane-fill": Plane,
  wifi: Wifi,
  coin: Coins,
};

export function faqIcon(slug: string): LucideIcon {
  return ICONS[slug] ?? CircleHelp;
}
