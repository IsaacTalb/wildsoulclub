import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const [{ data, error }, { data: todayPaidSales, error: todayError }] = await Promise.all([
      supabaseAdmin.rpc("admin_dashboard_report", { p_timezone: "Asia/Yangon" }),
      supabaseAdmin.rpc("admin_today_paid_sales", { p_timezone: "Asia/Yangon" }),
    ]);

    if (error) throw error;
    if (todayError) throw todayError;

    const report = data as Record<string, unknown>;
    const stats = (report.stats ?? {}) as Record<string, unknown>;
    const liveData = { ...report, stats: { ...stats, today_sales: Number(todayPaidSales ?? 0) } };

    return NextResponse.json(
      { success: true, data: liveData },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "Unauthorized" ? 401 : message.startsWith("Forbidden") ? 403 : 500;

    return NextResponse.json(
      { success: false, error: status === 500 ? "Failed to load dashboard report" : message },
      { status, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
