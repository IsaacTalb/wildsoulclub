import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { order_id, method } = body;

    if (!order_id || !method) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id,
        user_id: user.id,
        method,
        amount: 0, // will be updated with order total
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
