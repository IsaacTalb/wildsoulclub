import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    const errorMessage = errorDescription ? `OAuth error: ${errorDescription}` : "Authentication failed";
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(errorMessage)}`);
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "missing-anon-key"
    );
    
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Session exchange error:", exchangeError);
      return NextResponse.redirect(`${origin}/sign-in?error=session_exchange_failed`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_code_missing`);
}