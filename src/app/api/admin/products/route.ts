import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth";

type UploadedImage = { image_url?: string; object_key?: string; file_size?: number; mime_type?: string };
type VariantInput = { id?: string; size?: string; color?: string; stock?: number | string; price?: number | string | null; sale_price?: number | string | null; sku?: string; is_active?: boolean; _delete?: boolean };

class VariantValidationError extends Error {}

const productFields = ["name", "slug", "description", "price", "sale_price", "discount_percent", "category_id", "collection_id", "stock", "sku", "barcode", "sizes", "colors", "thumbnail_url", "thumbnail_key", "is_active", "is_archived", "is_featured", "is_new_drop", "is_archive_sale", "new_drop_start_date", "new_drop_end_date", "meta_title", "meta_description"];

function normalizeValue(field: string, value: unknown) {
  if (value === "") return null;
  if (["sizes", "colors"].includes(field) && typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  if (["price", "sale_price"].includes(field) && value != null) return Number(value);
  if (["discount_percent", "stock"].includes(field) && value != null) return Number(value);
  return value;
}

function productPayload(value: Record<string, unknown>) {
  return Object.fromEntries(productFields.filter((field) => field in value).map((field) => [field, normalizeValue(field, value[field])]));
}

async function appendProductImages(productId: string, images: unknown) {
  if (!Array.isArray(images) || images.length === 0) return;
  const { count } = await supabaseAdmin.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
  const startingOrder = count ?? 0;
  const rows = (images as UploadedImage[])
    .filter((image) => image.image_url && image.object_key)
    .map((image, index) => ({
      product_id: productId,
      image_url: image.image_url!,
      object_key: image.object_key!,
      file_size: image.file_size ?? null,
      mime_type: image.mime_type ?? null,
      is_thumbnail: startingOrder === 0 && index === 0,
      sort_order: startingOrder + index,
    }));
  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from("product_images").insert(rows);
    if (error) throw error;
  }
}

function nullableText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function nullableMoney(value: unknown, label: string) {
  if (value === "" || value == null) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new VariantValidationError(`${label} must be a non-negative number.`);
  return amount;
}

function variantStock(value: unknown) {
  const stock = Number(value ?? 0);
  if (!Number.isInteger(stock) || stock < 0) throw new VariantValidationError("Variant stock must be a non-negative whole number.");
  return stock;
}

function variantActive(value: unknown) {
  return typeof value === "boolean" ? value : true;
}

function variantIdentityKey(variant: { size: string | null; color: string | null; sku: string | null }) {
  const sku = variant.sku?.toLowerCase();
  if (sku) return `sku:${sku}`;
  return `option:${variant.size?.toLowerCase() ?? ""}:${variant.color?.toLowerCase() ?? ""}`;
}

async function syncVariants(productId: string, variants: unknown) {
  if (!Array.isArray(variants)) return;
  const rows = [];
  const identityKeys = new Set<string>();

  for (const variant of variants as VariantInput[]) {
    if (variant.id && variant._delete) {
      rows.push({ id: variant.id, _delete: true });
      continue;
    }

    const row = {
      id: variant.id,
      product_id: productId,
      size: nullableText(variant.size),
      color: nullableText(variant.color),
      stock: variantStock(variant.stock),
      price: nullableMoney(variant.price, "Variant price"),
      sale_price: nullableMoney(variant.sale_price, "Variant sale price"),
      sku: nullableText(variant.sku),
      is_active: variantActive(variant.is_active),
    };

    if (!row.size && !row.color && !row.sku) {
      if (row.id) throw new VariantValidationError("Each existing variant must include a size, color, or SKU.");
      continue;
    }

    if (row.sale_price != null && row.price != null && row.sale_price > row.price) {
      throw new VariantValidationError("Variant sale price cannot exceed variant price.");
    }

    const identityKey = variantIdentityKey(row);
    if (identityKeys.has(identityKey)) throw new VariantValidationError("Duplicate variants are not allowed for the same product.");
    identityKeys.add(identityKey);
    rows.push(row);
  }

  for (const row of rows) {
    if ("_delete" in row) {
      const { error } = await supabaseAdmin.from("product_variants").delete().eq("id", row.id).eq("product_id", productId);
      if (error) throw error;
      continue;
    }

    if (row.id) {
      const updateRow = { ...row };
      delete updateRow.id;
      const { error } = await supabaseAdmin.from("product_variants").update(updateRow).eq("id", row.id).eq("product_id", productId);
      if (error) throw error;
    } else {
      const insertRow = { ...row };
      delete insertRow.id;
      const { error } = await supabaseAdmin.from("product_variants").insert(insertRow);
      if (error) throw error;
    }
  }
}

async function setThumbnail(productId: string, imageId: string) {
  const { data: image, error: imageError } = await supabaseAdmin.from("product_images").select("image_url, object_key").eq("id", imageId).eq("product_id", productId).single();
  if (imageError) throw imageError;
  const { error: clearError } = await supabaseAdmin.from("product_images").update({ is_thumbnail: false }).eq("product_id", productId);
  if (clearError) throw clearError;
  const { error: setError } = await supabaseAdmin.from("product_images").update({ is_thumbnail: true }).eq("id", imageId);
  if (setError) throw setError;
  const { error: productError } = await supabaseAdmin.from("products").update({ thumbnail_url: image.image_url, thumbnail_key: image.object_key, updated_at: new Date().toISOString() }).eq("id", productId);
  if (productError) throw productError;
}

async function reorderImages(productId: string, imageOrder: unknown) {
  if (!Array.isArray(imageOrder)) return;
  for (const [index, imageId] of imageOrder.entries()) {
    const { error } = await supabaseAdmin.from("product_images").update({ sort_order: index }).eq("id", imageId).eq("product_id", productId);
    if (error) throw error;
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, product_images(*), product_variants(*), categories(id, name), collections(id, name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    if (!body.name || !body.price) return NextResponse.json({ success: false, error: "Name and price are required" }, { status: 400 });
    const slug = body.slug || body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data: product, error } = await supabaseAdmin.from("products").insert({ ...productPayload(body), slug }).select().single();
    if (error) throw error;
    await appendProductImages(product.id, body.images);
    await syncVariants(product.id, body.variants);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    if (error instanceof VariantValidationError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, imageAction, imageId, imageOrder } = body;
    if (!id) return NextResponse.json({ success: false, error: "Product id is required" }, { status: 400 });

    if (imageAction === "delete" && imageId) {
      const { error } = await supabaseAdmin.from("product_images").delete().eq("id", imageId).eq("product_id", id);
      if (error) throw error;
    } else if (imageAction === "thumbnail" && imageId) {
      await setThumbnail(id, imageId);
    } else if (imageAction === "reorder") {
      await reorderImages(id, imageOrder);
    } else {
      const { error } = await supabaseAdmin.from("products").update({ ...productPayload(body), updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await appendProductImages(id, body.images);
      await syncVariants(id, body.variants);
    }

    const { data, error: fetchError } = await supabaseAdmin.from("products").select("*, product_images(*), product_variants(*), categories(id, name), collections(id, name)").eq("id", id).single();
    if (fetchError) throw fetchError;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof VariantValidationError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Product id is required" }, { status: 400 });
    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}
