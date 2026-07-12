import { headers } from "next/headers";
import { createClient, type User } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase-admin";

function getSupabaseEnv() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase URL or anon key environment variables.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function getAuthUser(): Promise<User | null> {
  const authorization = (await headers()).get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) return null;

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  return user;
}

export async function isAdmin(userId?: string | null) {
  if (!userId) return false;

  const { data: adminData, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  return !adminError && !!adminData;
}

export async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const allowed = await isAdmin(user.id);
  if (!allowed) throw new Error("Forbidden: Admins only");

  return user.id;
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}
