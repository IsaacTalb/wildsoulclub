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
    "/products(.*)",
    "/collections(.*)",
    "/about",
    "/new-drops",
    "/archive-sales",
    "/delivery",
    "/privacy",
    "/terms",
    "/api/public(.*)",
    "/api/products(.*)",
    "/sign-in",
    "/sign-up",
    "/api/auth(.*)",
  ];
  return publicPatterns.some(p => matchesPattern(pathname, p));
}

function isAdminRoute(pathname: string): boolean {
  return matchesPattern(pathname, "/admin(.*)");
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Create a Supabase client for the middleware using cookies
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
      ? undefined
      : undefined
  );

  // Admin route protection
  if (isAdminRoute(pathname)) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
    // Check if user is an admin by checking the admins table
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("admins")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (adminError || !adminData) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

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
