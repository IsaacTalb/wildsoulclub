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
    "/best-sellers",
    "/products",
    "/products(.*)",
    "/collections(.*)",
    "/cart",
    "/wishlist",
    "/contact",
    "/checkout",
    "/order-success",
    "/orders",
    "/order",
    "/about",
    "/new-drops",
    "/new-drops(.*)",
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
    // Customer APIs authenticate the Supabase Bearer token in their route
    // handlers. They must not be redirected by the cookie-based page guard.
    "/api/orders(.*)",
    "/api/payments(.*)",
    "/api/profile(.*)",
    // Coupon validation is a public storefront API. Keeping it behind the
    // cookie guard redirects guest requests to the sign-in HTML page.
    "/api/coupons(.*)",
    // Supabase browser sessions are stored client-side, so admin pages must load
    // before src/app/admin/layout.tsx can verify the user. This is only a UI
    // gate; every admin API request is independently protected by requireAdmin().
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

  // These routes either contain public UI or perform their own Bearer-token
  // authorization. In particular, /admin is gated by the client layout while
  // /api/admin handlers enforce the actual server-side security boundary.
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
    "/((?!_next/static|_next/image|.*\\..*).*)",
  ],
};
