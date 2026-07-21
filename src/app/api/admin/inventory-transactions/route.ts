import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("inventory_transactions")
      .select("*, products(name, sku), product_variants(size, color, sku), users(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch inventory history" }, { status: 500 });
  }
}
