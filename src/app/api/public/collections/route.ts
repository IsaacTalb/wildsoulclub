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
      .from("collections")
      .select("*, products:products(count)")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return NextResponse.json({ success: true, data: (data ?? []).map((collection) => ({ ...collection, image_url: imageUrl(collection.image_url, collection.object_key) })) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch collections" }, { status: 500 });
  }
}
