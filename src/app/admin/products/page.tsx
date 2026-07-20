import { ResourceManager } from "@/components/admin/resource-manager";
const fields = [
  { key: "name", label: "Name", required: true },
  { key: "slug", label: "Slug", required: true },
  { key: "description", label: "Description", type: "textarea" as const, required: true },
  { key: "price", label: "Price (MMK)", type: "number" as const, required: true },
  { key: "sale_price", label: "Sale price", type: "number" as const },
  { key: "discount_percent", label: "Discount percent", type: "number" as const },
  { key: "category_id", label: "Category ID" },
  { key: "collection_id", label: "Collection ID" },
  { key: "stock", label: "Stock", type: "number" as const },
  { key: "sku", label: "SKU" },
  { key: "barcode", label: "Barcode" },
  { key: "sizes", label: "Sizes (comma separated)" },
  { key: "colors", label: "Colors (comma separated)" },
  { key: "thumbnail_url", label: "Thumbnail image", type: "image" as const, folder: "products", objectKeyField: "thumbnail_key" },
  { key: "is_active", label: "Active", type: "boolean" as const, defaultValue: true },
  { key: "is_archived", label: "Archived", type: "boolean" as const },
  { key: "is_featured", label: "Featured", type: "boolean" as const },
  { key: "is_new_drop", label: "New drop", type: "boolean" as const },
  { key: "is_archive_sale", label: "Archive sale", type: "boolean" as const },
  { key: "new_drop_start_date", label: "New drop start", type: "datetime-local" as const },
  { key: "new_drop_end_date", label: "New drop end", type: "datetime-local" as const },
  { key: "meta_title", label: "Meta title" },
  { key: "meta_description", label: "Meta description", type: "textarea" as const },
  { key: "images", label: "Product images", type: "images" as const, folder: "products" }
];

export default function Page() {
  return <ResourceManager title="Products" resource="products" fields={fields} />;
}
