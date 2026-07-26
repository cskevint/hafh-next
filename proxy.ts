import { NextResponse, type NextRequest } from "next/server";
import { isAuthorized, unauthorizedResponse } from "@/lib/admin-auth";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts` and the exported function to
 * `proxy`. Same semantics, same `config.matcher`.
 *
 * Scoped to /admin only. Site-wide redirects deliberately live in
 * next.config.ts instead, because `redirects()` compiles into Vercel's routing
 * layer and resolves before any function boots, whereas this runs per-request
 * and is billed per invocation.
 */
export function proxy(request: NextRequest) {
  /* Let dead PHP paths under /admin fall through to a normal 404 instead of
   * being challenged. /admin/updatesite.php was the old git-pull deploy hook;
   * answering 401 there tells a crawler the URL still exists, which is worse
   * than 404 for something that should simply be gone. */
  if (request.nextUrl.pathname.endsWith(".php")) {
    return NextResponse.next();
  }

  if (!isAuthorized(request.headers.get("authorization"))) {
    return unauthorizedResponse();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
