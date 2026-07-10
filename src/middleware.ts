import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

const isPublicRoute = createRouteMatcher([
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
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const adminIds = process.env.CLERK_ADMIN_USER_IDS?.split(",").map(id => id.trim()).filter(id => id) || [];

  if (isAdminRoute(req)) {
    await auth.protect();
    if (!userId) {
      console.log(`Access denied to admin route. User ID: ${userId}, Admin IDs: ${adminIds.join(",")}`);
      return Response.redirect(new URL("/", req.url));
    }

    // Check if the user is an admin in Supabase
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from("admins")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (adminError || !adminData) {
      console.log(`Access denied to admin route. User ID: ${userId} is not an admin in Supabase.`);
      return Response.redirect(new URL("/", req.url));
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
