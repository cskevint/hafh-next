"use client";

import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (
        siteKey: string,
        opts: { action: string },
      ) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/**
 * Loads reCAPTCHA v3 on demand and mints a token per submission.
 *
 * The script is injected here rather than in the root layout so only the pages
 * that actually need it pay for the third-party download — the course and
 * landing pages don't.
 *
 * Requiring JS is not a regression: contactus.php used the auto-bind pattern
 * (`class="g-recaptcha" data-callback="onContactUsSubmit"`) whose callback
 * called form.submit(), so a zero-JS visitor could never submit that form
 * either.
 */
export function useRecaptcha(action: string) {
  const loaded = useRef(false);

  useEffect(() => {
    if (!SITE_KEY || loaded.current) return;
    if (document.querySelector("script[data-recaptcha]")) {
      loaded.current = true;
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptcha = "true";
    document.head.appendChild(script);
    loaded.current = true;
  }, []);

  /** Resolves to a token, or null when reCAPTCHA isn't configured/available.
   * The server treats a missing token as a failure only when it has a secret
   * key configured, so local dev without keys still works. */
  const getToken = useCallback(async (): Promise<string | null> => {
    if (!SITE_KEY || !window.grecaptcha) return null;
    try {
      return await new Promise<string>((resolve, reject) => {
        window.grecaptcha!.ready(() => {
          window
            .grecaptcha!.execute(SITE_KEY, { action })
            .then(resolve)
            .catch(reject);
        });
      });
    } catch {
      return null;
    }
  }, [action]);

  return { getToken, enabled: Boolean(SITE_KEY) };
}
