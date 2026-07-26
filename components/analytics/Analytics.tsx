import Script from "next/script";
import { analyticsEnabled } from "@/lib/analytics";

/**
 * GA4 + Meta Pixel.
 *
 * Gated on VERCEL_ENV plus an explicit NEXT_PUBLIC_ANALYTICS_MODE=debug escape
 * hatch. The PHP gated on its own STAGE constant with no override, which made
 * it impossible to verify pixel parity on a staging deploy — exactly when you
 * need to.
 *
 * IDs come from env but are not secrets: both were already public in the
 * shipped PHP <head>. The earlier migration attempt left the pixel id as the
 * literal string 'YOUR_PIXEL_ID' and dropped the <noscript> fallback entirely.
 */
export function Analytics() {
  if (!analyticsEnabled()) return null;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
          </Script>
        </>
      ) : null}

      {pixelId ? (
        <>
          <Script id="fb-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}
    </>
  );
}
