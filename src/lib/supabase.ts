import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl && process.env.NODE_ENV !== "production") {
  console.warn("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
}

if (!supabaseAnonKey && process.env.NODE_ENV !== "production") {
  console.warn(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable."
  );
}

// Browser/client Supabase client. Do not import service-role credentials here.
// Fallback values allow static prerendering when env vars are injected only at runtime.
export const supabase = createClient(
  supabaseUrl ?? "https://example.supabase.co",
  supabaseAnonKey ?? "missing-anon-key"
);
