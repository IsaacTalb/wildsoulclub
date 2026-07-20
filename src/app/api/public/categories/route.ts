import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function imageUrl(imageUrl?: string | null, objectKey?: string | null) {
  if (imageUrl?.startsWith("http") || imageUrl?.startsWith("/")) return imageUrl;
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base && objectKey ? `${base}/${objectKey}` : imageUrl || objectKey || null;
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*, products:products(count)")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return NextResponse.json({ success: true, data: (data ?? []).map((category) => ({ ...category, image_url: imageUrl(category.image_url, category.object_key) })) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}
