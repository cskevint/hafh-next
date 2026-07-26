"use client";

/**
 * Last-resort boundary for errors thrown by the ROOT layout itself, which
 * app/error.tsx cannot catch. It must render its own <html> and <body>, and
 * cannot rely on fonts, globals.css, or any shared chrome — those are exactly
 * what may have failed.
 *
 * Styles are inline for that reason. The PHP had no equivalent.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#efd6ba",
          color: "#230906",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: "1.5rem" }}>
            Please try again, or visit{" "}
            <a href="/" style={{ color: "#0279ad" }}>
              our homepage
            </a>
            .
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: "#0279ad",
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              padding: "0.5rem 1.5rem",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
