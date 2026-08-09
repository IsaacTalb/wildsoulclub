import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { writeAuditLog, writeInventoryTransaction } from "@/lib/operational-history";
import { couponSchema } from "@/schemas";
import { getR2PublicUrl, publicImageUrl } from "@/lib/server/public-image-url";

const resources = {
  products: { table: "products", orderBy: "created_at", fields: ["name", "slug", "description", "price", "sale_price", "discount_percent", "category_id", "collection_id", "drop_id", "stock", "sku", "barcode", "sizes", "colors", "thumbnail_url", "thumbnail_key", "is_active", "is_archived", "is_featured", "is_new_drop", "is_archive_sale", "new_drop_start_date", "new_drop_end_date", "meta_title", "meta_description"] },
  categories: { table: "categories", orderBy: "created_at", fields: ["name", "slug", "description", "image_url", "object_key", "sort_order", "is_active"] },
  collections: { table: "collections", orderBy: "created_at", fields: ["name", "slug", "description", "image_url", "object_key", "is_active", "start_date", "end_date"] },
  drops: { table: "drops", orderBy: "release_date", fields: ["collection_id", "name", "slug", "description", "release_date", "status", "banner_image_url", "banner_object_key"] },
  coupons: { table: "coupons", orderBy: "created_at", fields: ["code", "description", "discount_type", "discount_value", "min_order_amount", "max_discount", "usage_limit", "is_active", "expires_at"] },
  delivery_regions: { table: "delivery_regions", orderBy: "created_at", fields: ["township", "city", "state", "delivery_fee", "min_order_free_delivery", "is_active"] },
  banners: { table: "banners", orderBy: "created_at", fields: ["title", "subtitle", "image_url", "object_key", "link_url", "is_active", "position", "product_id", "collection_id"] },
  hero_sliders: { table: "hero_sliders", orderBy: "created_at", fields: ["title", "subtitle", "button_text", "button_url", "image_url", "object_key", "is_active", "sort_order", "product_id", "collection_id"] },
  pages: { table: "pages", orderBy: "created_at", fields: ["title", "slug", "content", "meta_title", "meta_description", "is_published"] },
  admin_settings: { table: "admin_settings", fields: ["key", "value", "group_name", "description"], orderBy: "updated_at" },
} as const;

type ResourceName = keyof typeof resources;

const resourceImageFields: Partial<Record<ResourceName, readonly [string, string]>> = {
  categories: ["image_url", "object_key"],
  collections: ["image_url", "object_key"],
  drops: ["banner_image_url", "banner_object_key"],
  products: ["thumbnail_url", "thumbnail_key"],
  banners: ["image_url", "object_key"],
  hero_sliders: ["image_url", "object_key"],
};

function config(resource: string) {
  return resources[resource as ResourceName];
}

function payload(resource: ResourceName, value: Record<string, unknown>) {
  const result = Object.fromEntries(resources[resource].fields
    .filter((field) => field in value)
    .map((field) => [field, normalizeValue(field, value[field])]));
  if (resource === "coupons" && typeof result.code === "string") result.code = result.code.trim().toUpperCase();
  const imageFields = resourceImageFields[resource];
  if (imageFields) {
    const [urlField, keyField] = imageFields;
    if (typeof result[keyField] === "string" && result[keyField]) {
      result[urlField] = getR2PublicUrl(result[keyField]);
    }
  }
  return result;
}

function normalizeValue(field: string, value: unknown) {
  if (value === "") return null;
  if (["sizes", "colors"].includes(field) && typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return value;
}

type UploadedProductImage = {
  image_url?: string;
  object_key?: string;
  file_size?: number;
  mime_type?: string;
};

async function appendProductImages(productId: string, images: unknown) {
  if (!Array.isArray(images) || images.length === 0) return;

  const { count } = await supabaseAdmin
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const startingOrder = count ?? 0;
  const rows = (images as UploadedProductImage[])
    .filter((image) => image.object_key)
    .map((image, index) => ({
      product_id: productId,
      image_url: getR2PublicUrl(image.object_key!),
      object_key: image.object_key!,
      file_size: image.file_size ?? null,
      mime_type: image.mime_type ?? null,
      is_thumbnail: startingOrder === 0 && index === 0,
      sort_order: startingOrder + index,
    }));

  if (rows.length === 0) return;
  const { error } = await supabaseAdmin.from("product_images").insert(rows);
  if (error) throw error;
}

async function getResource(params: Promise<{ resource: string }>) {
  const { resource } = await params;
  const resourceConfig = config(resource);
  if (!resourceConfig) throw new Error("Unknown resource");
  return { resource: resource as ResourceName, resourceConfig };
}

function normalizeResourceRow(resource: ResourceName, row: Record<string, any>) {
  if (resource === "products") {
    return {
      ...row,
      thumbnail_url: publicImageUrl(row.thumbnail_url, row.thumbnail_key),
      product_images: (row.product_images ?? []).map((image: Record<string, any>) => ({
        ...image,
        image_url: publicImageUrl(image.image_url, image.object_key),
        transparent_url: publicImageUrl(image.transparent_url, image.transparent_object_key),
      })),
    };
  }
  const imageFields = resourceImageFields[resource];
  if (!imageFields) return row;
  const [urlField, keyField] = imageFields;
  return { ...row, [urlField]: publicImageUrl(row[urlField], row[keyField]) };
}

type ResourceContext = { params: Promise<{ resource: string }> };

export async function GET(request: Request, { params }: ResourceContext) {
  try {
    await requireAdmin();
    const { resource, resourceConfig } = await getResource(params);
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    let query = supabaseAdmin.from(resourceConfig.table).select(resource === "products" ? "*, product_images(*)" : "*");
    if (resource === "products" && !includeDeleted) query = query.is("deleted_at", null);
    if ("orderBy" in resourceConfig) query = query.order(resourceConfig.orderBy, { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, data: (data ?? []).map((row) => normalizeResourceRow(resource, row)) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error && error.message === "Unknown resource" ? "Unknown resource" : "Unable to load resource" }, { status: 400 });
  }
}

export async function POST(request: Request, { params }: ResourceContext) {
  try {
    const adminUserId = await requireAdmin();
    const { resource, resourceConfig } = await getResource(params);
    const json = await request.json();
    const validated = resource === "coupons" ? couponSchema.parse(json) : json;
    const body = payload(resource, validated);
    const { data, error } = await supabaseAdmin.from(resourceConfig.table).insert(body).select().single();
    if (error) throw error;
    if (resource === "products") {
      await appendProductImages(data.id, json.images);
      await writeInventoryTransaction({ productId: data.id, quantityDelta: Number(data.stock ?? 0), reason: "manual_adjustment", referenceType: "product", referenceId: data.id, actorUserId: adminUserId });
      await writeAuditLog({ actorUserId: adminUserId, entityType: "product", entityId: data.id, action: "create", after: data });
    }
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to create resource" }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: ResourceContext) {
  try {
    const adminUserId = await requireAdmin();
    const { resource, resourceConfig } = await getResource(params);
    const { id, ...values } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "Record id is required" }, { status: 400 });
    const { data: before, error: beforeError } = resource === "products"
      ? await supabaseAdmin.from(resourceConfig.table).select("*").eq("id", id).single()
      : { data: null, error: null };
    if (beforeError) throw beforeError;
    const validated = resource === "coupons" ? couponSchema.partial().parse(values) : values;
    const { data, error } = await supabaseAdmin.from(resourceConfig.table).update(payload(resource, validated)).eq("id", id).select().single();
    if (error) throw error;
    if (resource === "products") {
      await appendProductImages(id, values.images);
      await writeInventoryTransaction({ productId: id, quantityDelta: Number(data.stock ?? 0) - Number(before?.stock ?? 0), reason: "manual_adjustment", referenceType: "product", referenceId: id, actorUserId: adminUserId });
      await writeAuditLog({ actorUserId: adminUserId, entityType: "product", entityId: id, action: "update", before, after: data });
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to update resource" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: ResourceContext) {
  try {
    await requireAdmin();
    const { resource, resourceConfig } = await getResource(params);
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "Record id is required" }, { status: 400 });
    const deletePayload = resource === "products" ? { deleted_at: new Date().toISOString(), is_active: false, is_archived: true } : null;
    const { error } = deletePayload
      ? await supabaseAdmin.from(resourceConfig.table).update(deletePayload).eq("id", id)
      : await supabaseAdmin.from(resourceConfig.table).delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to delete resource" }, { status: 400 });
  }
}
