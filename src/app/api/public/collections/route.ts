import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { publicImageUrl } from "@/lib/server/public-image-url";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("collections")
      .select("*, products:products(count)")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return NextResponse.json({ success: true, data: (data ?? []).map((collection) => ({ ...collection, image_url: publicImageUrl(collection.image_url, collection.object_key) })) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch collections" }, { status: 500 });
  }
}
