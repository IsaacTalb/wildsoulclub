import { NextResponse } from "next/server";
import { normalizeDrop } from "../route";
import { supabaseAdmin } from "@/lib/supabase-admin";

const PRODUCT_SELECT = "id, name, slug, description, price, sale_price, thumbnail_url, thumbnail_key, is_active, is_new_drop, product_images(id, image_url, object_key, is_thumbnail, sort_order), categories(id, name, slug)";
const DROP_SELECT = `id, collection_id, name, slug, description, release_date, status, banner_image_url, banner_object_key, created_at, updated_at, collections(id, name, slug), products(${PRODUCT_SELECT})`;

type DropContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: DropContext) {
  try {
    const { slug } = await params;
    const { data, error } = await supabaseAdmin.from("drops").select(DROP_SELECT).eq("slug", slug).in("status", ["scheduled", "active"]).single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: normalizeDrop(data) });
  } catch {
    return NextResponse.json({ success: false, error: "Drop not found" }, { status: 404 });
  }
}
