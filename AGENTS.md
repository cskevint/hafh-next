<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single Next.js 16 (App Router, Turbopack) app; no backend/db services to start. Dependencies are refreshed by the startup update script (`npm install`), so just run commands directly.

- Run dev: `npm run dev` (serves on port 3000). Standard scripts are in `package.json` / `README.md`.
- Checks: `npm run lint`, `npm run typecheck`. There is **no automated test suite** (no `test` script/framework). `npm run check:redirects -- --base <url>` validates the legacy URL surface and needs a running server to hit.
- Gotcha — everything degrades gracefully with no env vars, and this is misleading when verifying: form submissions (contact / lead capture / newsletter) return a **success** message even though nothing is emailed (Resend), persisted (Vercel Blob), or synced (HubSpot). The server logs the real outcome (e.g. `[leads] Blob not configured...`, `[email] RESEND_API_KEY not set...`). Do not treat a UI success as proof of delivery/persistence.
- Lead persistence needs `BLOB_READ_WRITE_TOKEN` locally (`vercel env pull`); without it `/admin/leads` shows nothing. `/admin/leads` fails closed — returns 401 unless `ADMIN_PASSWORD` is set (HTTP Basic, any username).
- Copy `.env.example` to `.env.local` to exercise the integrations; see `README.md` for what each variable does.
