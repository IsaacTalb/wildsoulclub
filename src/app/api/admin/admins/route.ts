import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("admins")
      .select("id, user_id, role, permissions, created_at, users(email, full_name, avatar_url)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("Failed to fetch admins:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}
