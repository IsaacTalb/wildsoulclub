import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper to match route patterns
function matchesPattern(pathname: string, pattern: string): boolean {
  if (pattern.endsWith("(.*)")) {
    const prefix = pattern.slice(0, -3);
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
  ];
  return publicPatterns.some(p => matchesPattern(pathname, p));
}


export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Create a Supabase client for the proxy using cookies
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  // Read the session from cookies
  const { data: { user } } = await supabase.auth.getUser(
    req.cookies.get("sb-access-token")?.value
  );

  // Admin authorization is enforced in the admin layout and admin API routes.
  // Supabase browser sessions live in client-managed storage, so this proxy cannot
  // reliably read them from cookies without the Supabase SSR cookie adapter.

  // Protect non-public routes
  if (!isPublicRoute(pathname)) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
