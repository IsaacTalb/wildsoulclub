import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, product_images(*)")
      .eq("is_new_drop", true)
      .eq("is_active", true)
      .order("new_drop_start_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch new drops" },
      { status: 500 }
    );
  }
}