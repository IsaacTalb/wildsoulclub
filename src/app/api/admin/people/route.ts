import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin.rpc("admin_people_report");
    if (error) throw error;
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: status === 500 ? "Failed to load users and customers" : message }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
