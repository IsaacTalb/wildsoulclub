import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth";
import { deleteFiles } from "@/lib/upload";
import { writeAuditLog, writeInventoryTransaction } from "@/lib/operational-history";

type UploadedImage = { image_url?: string; object_key?: string; file_size?: number; mime_type?: string };
type VariantInput = { id?: string; size?: string; color?: string; stock?: number | string; price?: number | string | null; sale_price?: number | string | null; sku?: string; is_active?: boolean; _delete?: boolean };

class VariantValidationError extends Error {}
class ImageCleanupError extends Error {}

const productFields = ["name", "slug", "description", "price", "sale_price", "discount_percent", "category_id", "collection_id", "stock", "sku", "barcode", "sizes", "colors", "thumbnail_url", "thumbnail_key", "is_active", "is_archived", "is_featured", "is_new_drop", "is_archive_sale", "new_drop_start_date", "new_drop_end_date", "meta_title", "meta_description"];


async function cleanupProductImageObjects(objectKeys: Array<string | null | undefined>, context: string) {
  try {
    await deleteFiles(objectKeys);
  } catch (error) {
    console.warn(`Recoverable R2 cleanup failure during ${context}`, error);
    throw new ImageCleanupError("Image cleanup failed. No database records were deleted; please retry.");
  }
}

async function deleteProductImage(productId: string, imageId: string) {
  const { data: image, error: fetchError } = await supabaseAdmin
    .from("product_images")
    .select("object_key")
    .eq("id", imageId)
    .eq("product_id", productId)
    .single();

  if (fetchError) throw fetchError;

  await cleanupProductImageObjects([image.object_key], `product image delete (${imageId})`);

  const { error } = await supabaseAdmin.from("product_images").delete().eq("id", imageId).eq("product_id", productId);
  if (error) throw error;
}

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

async function syncVariants(productId: string, variants: unknown, actorUserId?: string | null) {
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
      const { data: beforeVariant, error: beforeError } = await supabaseAdmin.from("product_variants").select("id, stock").eq("id", row.id).eq("product_id", productId).single();
      if (beforeError) throw beforeError;
      const { error } = await supabaseAdmin.from("product_variants").update(updateRow).eq("id", row.id).eq("product_id", productId);
      if (error) throw error;
      const quantityDelta = row.stock - Number(beforeVariant.stock ?? 0);
      await writeInventoryTransaction({ productId, variantId: row.id, quantityDelta, reason: "manual_adjustment", referenceType: "product_variant", referenceId: row.id, actorUserId });
    } else {
      const insertRow = { ...row };
      delete insertRow.id;
      const { data: newVariant, error } = await supabaseAdmin.from("product_variants").insert(insertRow).select("id").single();
      if (error) throw error;
      await writeInventoryTransaction({ productId, variantId: newVariant.id, quantityDelta: row.stock, reason: "manual_adjustment", referenceType: "product_variant", referenceId: newVariant.id, actorUserId });
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

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    let query = supabaseAdmin
      .from("products")
      .select("*, product_images(*), product_variants(*), categories(id, name), collections(id, name)");
    if (!includeDeleted) query = query.is("deleted_at", null);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUserId = await requireAdmin();
    const body = await req.json();
    if (!body.name || !body.price) return NextResponse.json({ success: false, error: "Name and price are required" }, { status: 400 });
    const slug = body.slug || body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data: product, error } = await supabaseAdmin.from("products").insert({ ...productPayload(body), slug }).select().single();
    if (error) throw error;
    await appendProductImages(product.id, body.images);
    await syncVariants(product.id, body.variants, adminUserId);
    await writeInventoryTransaction({ productId: product.id, quantityDelta: Number(product.stock ?? 0), reason: "manual_adjustment", referenceType: "product", referenceId: product.id, actorUserId: adminUserId });
    await writeAuditLog({ actorUserId: adminUserId, entityType: "product", entityId: product.id, action: "create", after: product });
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    if (error instanceof VariantValidationError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const adminUserId = await requireAdmin();
    const body = await req.json();
    const { id, imageAction, imageId, imageOrder } = body;
    if (!id) return NextResponse.json({ success: false, error: "Product id is required" }, { status: 400 });

    const { data: beforeProduct, error: beforeError } = await supabaseAdmin.from("products").select("*, product_variants(*)").eq("id", id).single();
    if (beforeError) throw beforeError;

    if (body.action === "restore") {
      const { error } = await supabaseAdmin.from("products").update({ deleted_at: null, is_active: true, is_archived: false, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    } else if (imageAction === "delete" && imageId) {
      await deleteProductImage(id, imageId);
    } else if (imageAction === "thumbnail" && imageId) {
      await setThumbnail(id, imageId);
    } else if (imageAction === "reorder") {
      await reorderImages(id, imageOrder);
    } else {
      const { error } = await supabaseAdmin.from("products").update({ ...productPayload(body), updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await appendProductImages(id, body.images);
      await syncVariants(id, body.variants, adminUserId);
    }

    const { data, error: fetchError } = await supabaseAdmin.from("products").select("*, product_images(*), product_variants(*), categories(id, name), collections(id, name)").eq("id", id).single();
    if (fetchError) throw fetchError;
    const stockBefore = Number(beforeProduct?.stock ?? 0);
    const stockAfter = Number(data?.stock ?? 0);
    await writeInventoryTransaction({ productId: id, quantityDelta: stockAfter - stockBefore, reason: "manual_adjustment", referenceType: "product", referenceId: id, actorUserId: adminUserId });
    await writeAuditLog({ actorUserId: adminUserId, entityType: "product", entityId: id, action: body.action === "restore" ? "restore" : imageAction ? `image_${imageAction}` : "update", before: beforeProduct, after: data });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof VariantValidationError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    if (error instanceof ImageCleanupError) return NextResponse.json({ success: false, warning: error.message }, { status: 409 });
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const adminUserId = await requireAdmin();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "Product id is required" }, { status: 400 });
    const { data: beforeProduct, error: beforeError } = await supabaseAdmin.from("products").select("*").eq("id", id).single();
    if (beforeError) throw beforeError;
    const { error } = await supabaseAdmin.from("products").update({ deleted_at: new Date().toISOString(), is_active: false, is_archived: true, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    await writeAuditLog({ actorUserId: adminUserId, entityType: "product", entityId: id, action: "archive", before: beforeProduct, after: { ...beforeProduct, is_active: false, is_archived: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ImageCleanupError) return NextResponse.json({ success: false, warning: error.message }, { status: 409 });
    return NextResponse.json({ success: false, error: "Failed to archive product" }, { status: 500 });
  }
}
