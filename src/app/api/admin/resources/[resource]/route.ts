import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const resources = {
  products: { table: "products", fields: ["name", "slug", "description", "price", "sale_price", "discount_percent", "category_id", "collection_id", "stock", "sku", "thumbnail_url", "thumbnail_key", "is_active", "is_archived", "is_featured", "is_new_drop", "is_archive_sale", "new_drop_start_date", "new_drop_end_date", "meta_title", "meta_description"] },
  categories: { table: "categories", fields: ["name", "slug", "description", "image_url", "object_key", "sort_order", "is_active"] },
  collections: { table: "collections", fields: ["name", "slug", "description", "image_url", "object_key", "is_active", "start_date", "end_date"] },
  coupons: { table: "coupons", fields: ["code", "description", "discount_type", "discount_value", "min_order_amount", "max_discount", "usage_limit", "is_active", "expires_at"] },
  delivery_regions: { table: "delivery_regions", fields: ["township", "city", "state", "delivery_fee", "min_order_free_delivery", "is_active"] },
  banners: { table: "banners", fields: ["title", "subtitle", "image_url", "object_key", "link_url", "is_active", "position", "product_id", "collection_id"] },
  hero_sliders: { table: "hero_sliders", fields: ["title", "subtitle", "button_text", "button_url", "image_url", "object_key", "is_active", "sort_order", "product_id", "collection_id"] },
  pages: { table: "pages", fields: ["title", "slug", "content", "meta_title", "meta_description", "is_published"] },
  site_settings: { table: "site_settings", fields: ["key", "value", "group_name", "description"] },
} as const;

type ResourceName = keyof typeof resources;

function config(resource: string) {
  return resources[resource as ResourceName];
}

function payload(resource: ResourceName, value: Record<string, unknown>) {
  return Object.fromEntries(resources[resource].fields
    .filter((field) => field in value)
    .map((field) => [field, value[field]]));
}

async function getResource(params: Promise<{ resource: string }>) {
  const { resource } = await params;
  const resourceConfig = config(resource);
  if (!resourceConfig) throw new Error("Unknown resource");
  return { resource: resource as ResourceName, resourceConfig };
}

type ResourceContext = { params: Promise<{ resource: string }> };

export async function GET(_request: Request, { params }: ResourceContext) {
  try {
    await requireAdmin();
    const { resourceConfig } = await getResource(params);
    const { data, error } = await supabaseAdmin.from(resourceConfig.table).select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error && error.message === "Unknown resource" ? "Unknown resource" : "Unable to load resource" }, { status: 400 });
  }
}

export async function POST(request: Request, { params }: ResourceContext) {
  try {
    await requireAdmin();
    const { resource, resourceConfig } = await getResource(params);
    const body = payload(resource, await request.json());
    const { data, error } = await supabaseAdmin.from(resourceConfig.table).insert(body).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Unable to create resource" }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: ResourceContext) {
  try {
    await requireAdmin();
    const { resource, resourceConfig } = await getResource(params);
    const { id, ...values } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "Record id is required" }, { status: 400 });
    const { data, error } = await supabaseAdmin.from(resourceConfig.table).update(payload(resource, values)).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to update resource" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: ResourceContext) {
  try {
    await requireAdmin();
    const { resourceConfig } = await getResource(params);
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "Record id is required" }, { status: 400 });
    const { error } = await supabaseAdmin.from(resourceConfig.table).delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to delete resource" }, { status: 400 });
  }
}
