import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "./supabase";

export async function getAuthUser() {
  const user = await currentUser();
  return user;
}

export async function getAuthSession() {
  const session = await auth();
  return session;
}

export async function isAdmin() {
  const { userId } = await auth();
  if (!userId) return false;

  // Check if the user is an admin in Supabase
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("*")
    .eq("user_id", userId)
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
