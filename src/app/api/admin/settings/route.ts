import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
