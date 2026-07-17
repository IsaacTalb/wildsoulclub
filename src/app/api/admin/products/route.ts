import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, product_images(*), product_variants(*), categories(name), collections(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { name, description, price, category_id, collection_id, images, variants, slug, stock, sku } = body;

    if (!name || !price) {
      return NextResponse.json(
        { success: false, error: "Name and price are required" },
        { status: 400 }
      );
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .insert({ name, slug: slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), description: description || "", price, category_id: category_id || null, collection_id: collection_id || null, stock: stock || 0, sku: sku || null, is_active: true })
      .select()
      .single();

    if (productError) throw productError;

    if (images?.length) {
      const { error: imagesError } = await supabaseAdmin
        .from("product_images")
        .insert(images.map((url: string, index: number) => ({
          product_id: product.id,
          image_url: url,
          object_key: url,
          is_thumbnail: index === 0,
        })));

      if (imagesError) throw imagesError;
    }

    if (variants?.length) {
      const { error: variantsError } = await supabaseAdmin
        .from("product_variants")
        .insert(variants.map((v: any) => ({
          product_id: product.id,
          size: v.size,
          color: v.color,
          stock: v.stock || 0,
        })));

      if (variantsError) throw variantsError;
    }

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
