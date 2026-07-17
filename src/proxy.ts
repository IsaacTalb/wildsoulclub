import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper to match route patterns
function matchesPattern(pathname: string, pattern: string): boolean {
  if (pattern.endsWith("(.*)")) {
    const prefix = pattern.slice(0, -4);
    return pathname === prefix || pathname.startsWith(prefix + "/");
  }
  return pathname === pattern;
}

function isPublicRoute(pathname: string): boolean {
  const publicPatterns = [
    "/",
    "/products",
    "/products(.*)",
    "/collections(.*)",
    "/about",
    "/new-drops",
    "/api/new-drops",
    "/archive-sales",
    "/api/archive-sales",
    "/delivery",
    "/privacy",
    "/terms",
    "/profile",
    "/api/public(.*)",
    "/api/products(.*)",
    "/sign-in",
    "/sign-up",
    "/api/auth(.*)",
    "/api/upload",
    // Let admin pages load so the client-side Supabase session can be verified
    // by src/app/admin/layout.tsx.
    "/admin(.*)",
    // Let admin route handlers receive Bearer tokens from the browser; each
    // /api/admin route still enforces admin access server-side.
    "/api/admin(.*)",
  ];
  return publicPatterns.some((pattern) => matchesPattern(pathname, pattern));
}

function redirectToSignIn(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  url.searchParams.set("redirect", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Public/admin-page routes must return before Supabase cookie checks. Supabase
  // browser auth stores sessions client-side in this app, so /admin pages are
  // authorized by the admin layout after hydration. /api/admin routes are not
  // public and remain protected by their route handlers.
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectToSignIn(req);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: { user } } = await supabase.auth.getUser(
    req.cookies.get("sb-access-token")?.value
  );

  if (!user) {
    return redirectToSignIn(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
