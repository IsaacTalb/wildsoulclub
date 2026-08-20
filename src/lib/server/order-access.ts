import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { timingSafeEqual } from "node:crypto";

const TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/;

export async function hashGuestOrderToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createGuestOrderToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString("base64url");
}

async function hashesMatch(actual: string, expected: string) {
  if (!TOKEN_HASH_PATTERN.test(actual) || !TOKEN_HASH_PATTERN.test(expected)) return false;
  const actualBytes = Uint8Array.from(actual.match(/../g)!, (value) => Number.parseInt(value, 16));
  const expectedBytes = Uint8Array.from(expected.match(/../g)!, (value) => Number.parseInt(value, 16));
  return timingSafeEqual(actualBytes, expectedBytes);
}

export async function authorizeOrderAccess(orderId: string, guestToken: unknown) {
  const user = await getAuthUser();
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, total, payment_reference, guest_access_token_hash")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!order) return null;
  if (user && order.user_id === user.id) return order;
  if (typeof guestToken !== "string" || guestToken.length < 32 || guestToken.length > 256) return null;

  const suppliedHash = await hashGuestOrderToken(guestToken);
  return order.user_id === null
    && typeof order.guest_access_token_hash === "string"
    && await hashesMatch(suppliedHash, order.guest_access_token_hash)
    ? order
    : null;
}
