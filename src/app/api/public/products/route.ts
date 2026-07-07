import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const collection = searchParams.get("collection");
    const sort = searchParams.get("sort");
    const search = searchParams.get("search");

    let query = supabaseAdmin
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .eq("status", "active");

    if (category) query = query.eq("category_id", category);
    if (collection) query = query.eq("collection_id", collection);
    if (search) query = query.ilike("name", `%${search}%`);

    if (sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
