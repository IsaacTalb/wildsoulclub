import "server-only";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl && process.env.NODE_ENV !== "production") {
  console.warn("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable.");
}

if (!supabaseServiceRoleKey && process.env.NODE_ENV !== "production") {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
}

// Server-only admin client (service role bypasses RLS). Never import from Client Components.
// Fallback values let `next build` collect route metadata in environments where runtime
// secrets are injected later (for example Vercel encrypted runtime env vars).
export const supabaseAdmin = createClient(
  supabaseUrl ?? "https://example.supabase.co",
  supabaseServiceRoleKey ?? "missing-service-role-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
