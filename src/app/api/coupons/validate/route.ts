import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

const requestSchema = z.object({
  code: z.string().trim().min(1).max(64),
  subtotal: z.number().nonnegative(),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Enter a valid coupon code." }, { status: 400 });

  const code = parsed.data.code.toUpperCase();
  const { data: coupon, error } = await supabaseAdmin.from("coupons").select("code, description, discount_type, discount_value, min_order_amount, max_discount, usage_limit, used_count, expires_at").ilike("code", code).eq("is_active", true).maybeSingle();
  if (error) return NextResponse.json({ success: false, error: "Coupon validation is temporarily unavailable." }, { status: 500 });
  if (!coupon || (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) || (coupon.usage_limit != null && Number(coupon.used_count) >= Number(coupon.usage_limit))) {
    return NextResponse.json({ success: false, error: "This coupon is invalid, expired, or fully used." }, { status: 400 });
  }
  if (coupon.min_order_amount != null && parsed.data.subtotal < Number(coupon.min_order_amount)) {
    return NextResponse.json({ success: false, error: `This coupon requires a minimum order of MMK ${Number(coupon.min_order_amount).toLocaleString()}.` }, { status: 400 });
  }

  const rawDiscount = coupon.discount_type === "percentage" ? parsed.data.subtotal * Number(coupon.discount_value) / 100 : Number(coupon.discount_value);
  const discount = Math.max(0, Math.min(parsed.data.subtotal, coupon.max_discount == null ? rawDiscount : Math.min(rawDiscount, Number(coupon.max_discount))));
  return NextResponse.json({ success: true, data: { code: coupon.code, description: coupon.description, discount, total: parsed.data.subtotal - discount } });
}
