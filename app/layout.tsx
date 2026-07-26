import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { SITE } from "@/content/site";
import { Analytics } from "@/components/analytics/Analytics";
import "./globals.css";

/**
 * Root metadata, ported from includes/head-tag-contents.php.
 *
 * The title format there was:
 *   "Hound Away From Home" + (pageTitle ? " - " + pageTitle : "")
 * so the template below reproduces it exactly, including the separator.
 *
 * The earlier migration attempt shipped NO openGraph block at all, which
 * silently destroyed all four social share cards and the per-page share
 * images. Those are restored here plus per-page overrides.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `${SITE.name} - %s`,
  },
  description: SITE.description,
  authors: [{ name: "Hound Away From Home, LLC" }],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    images: [{ url: SITE.shareImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
    images: [SITE.shareImage],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#5bbad5" }],
  },
  other: {
    "msapplication-TileColor": "#da532c",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* data-scroll-behavior="smooth" is required as of Next 16: the framework no
     * longer overrides scroll-behavior during route transitions unless asked.
     * Without it, in-page smooth anchors on the course page would make route
     * navigations animate a long scroll instead of jumping instantly. */
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
