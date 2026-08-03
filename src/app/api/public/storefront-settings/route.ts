import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const STOREFRONT_SETTING_KEYS = [
  "delivery_notice",
  "kpay_number",
  "wave_number",
  "ayapay_number",
  "cbpay_number",
] as const;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_settings")
      .select("key,value")
      .in("key", [...STOREFRONT_SETTING_KEYS]);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: Object.fromEntries(
        (data ?? []).map((setting) => [setting.key, setting.value]),
      ),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load storefront settings" },
      { status: 500 },
    );
  }
}
