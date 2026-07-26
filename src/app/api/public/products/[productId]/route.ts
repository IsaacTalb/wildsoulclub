import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  normalizePublicProduct,
  PUBLIC_PRODUCT_SELECT,
  type PublicProductRow,
} from "@/lib/server/public-product";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        productId,
      );
    let query = supabaseAdmin
      .from("products")
      .select(PUBLIC_PRODUCT_SELECT)
      .eq("is_active", true)
      .is("deleted_at", null);
    query = isUuid ? query.eq("id", productId) : query.eq("slug", productId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data)
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    return NextResponse.json({
      success: true,
      data: normalizePublicProduct(data as PublicProductRow),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}
