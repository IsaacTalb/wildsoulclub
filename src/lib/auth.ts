import { supabaseAdmin } from "./supabase";
import { createClient } from "@supabase/supabase-js";

export async function getAuthUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getAuthSession() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function isAdmin() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Check if the user is an admin in Supabase
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (adminError || !adminData) {
    return false;
  }

  return true;
}

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const adminIds = (process.env.CLERK_ADMIN_USER_IDS || "").split(",");
  if (!adminIds.includes(userId)) throw new Error("Forbidden: Admins only");

  return userId;
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
