"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ArchiveRestore, ArrowDown, ArrowUp, ChevronsUpDown, Copy, ImageIcon, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };
type ProductImage = { id: string; image_url: string; object_key: string; is_thumbnail: boolean; sort_order: number };
type ProductVariant = { id?: string; size?: string; color?: string; stock?: number | string; price?: number | string | null; sale_price?: number | string | null; sku?: string; is_active?: boolean; _delete?: boolean };
type ProductRow = Record<string, any> & { product_images?: ProductImage[]; product_variants?: ProductVariant[]; categories?: Option | null; collections?: Option | null; drops?: Option | null };

const blankProduct: ProductRow = {
  name: "",
  slug: "",
  description: "",
  price: "",
  sale_price: "",
  discount_percent: 0,
  category_id: "",
  collection_id: "",
  drop_id: "",
  stock: 0,
  sku: "",
  barcode: "",
  sizes: [],
  colors: [],
  thumbnail_url: "",
  thumbnail_key: "",
  is_active: true,
  is_archived: false,
  is_featured: false,
  is_new_drop: false,
  is_archive_sale: false,
  new_drop_start_date: "",
  new_drop_end_date: "",
  meta_title: "",
  meta_description: "",
  product_images: [],
  product_variants: [],
};

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function getSession() {
  const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
  return session;
}

function formatInputDate(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}

function listToText(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : String(value ?? "");
}

function SearchableSelect({
  name,
  value,
  options,
  placeholder,
  searchPlaceholder,
  loading,
  loadingText,
  emptyText,
  required,
  error,
  onChange,
}: {
  name: string;
  value?: string | null;
  options: Option[];
  placeholder: string;
  searchPlaceholder: string;
  loading: boolean;
  loadingText: string;
  emptyText: string;
  required?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.id === value);

  return (
    <div className="space-y-1">
      <input name={name} type="hidden" value={value ?? ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          aria-expanded={open}
          aria-invalid={Boolean(error)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 text-sm outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            !selectedOption && "text-muted-foreground",
            error && "border-destructive focus-visible:ring-destructive/20"
          )}
        >
          <span>{selectedOption?.name ?? (loading ? loadingText : placeholder)}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[calc(var(--radix-popover-trigger-width))] min-w-[260px] p-0 sm:min-w-[320px] md:min-w-[380px]"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{loading ? loadingText : emptyText}</CommandEmpty>
              <CommandGroup>
                {!required && (
                  <CommandItem
                    value="__none__"
                    data-checked={!value}
                    onSelect={() => {
                      onChange("");
                      setOpen(false);
                    }}
                  >
                    None
                  </CommandItem>
                )}
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    data-checked={option.id === value}
                    onSelect={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                  >
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ProductManager() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [collections, setCollections] = useState<Option[]>([]);
  const [drops, setDrops] = useState<Option[]>([]);
  const [record, setRecord] = useState<ProductRow>(blankProduct);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bulkSizes, setBulkSizes] = useState("");
  const [bulkColors, setBulkColors] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  const sortedImages = useMemo(() => [...(record.product_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)), [record.product_images]);

  async function authHeaders(): Promise<Record<string, string>> {
    const session = await getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  }

  async function load() {
    setLoading(true);
    setError("");
    setOptionsLoading(true);
    try {
      const headers = await authHeaders();
      const [productsResponse, categoriesResponse, collectionsResponse, dropsResponse] = await Promise.all([
        fetch(`/api/admin/products${showDeleted ? "?includeDeleted=true" : ""}`, { headers }),
        fetch("/api/public/categories"),
        fetch("/api/public/collections"),
        fetch("/api/public/drops"),
      ]);
      const productsJson = await readJson(productsResponse);
      const categoriesJson = await readJson(categoriesResponse);
      const collectionsJson = await readJson(collectionsResponse);
      const dropsJson = await readJson(dropsResponse);
      if (!productsResponse.ok) throw new Error(productsJson.error ?? "Unable to load products");
      if (!categoriesResponse.ok) throw new Error(categoriesJson.error ?? "Unable to load categories");
      if (!collectionsResponse.ok) throw new Error(collectionsJson.error ?? "Unable to load collections");
      if (!dropsResponse.ok) throw new Error(dropsJson.error ?? "Unable to load drops");
      setDrops(dropsJson.data ?? []);
      setProducts(productsJson.data ?? []);
      setCategories(categoriesJson.data ?? []);
      setCollections(collectionsJson.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products");
    } finally {
      setLoading(false);
      setOptionsLoading(false);
    }
  }

  useEffect(() => { load(); }, [showDeleted]);

  function openCreate() {
    setRecord({ ...blankProduct, product_images: [], product_variants: [] });
    setVariants([{ size: "", color: "", stock: 0, price: "", sale_price: "", sku: "", is_active: true }]);
    setBulkSizes("");
    setBulkColors("");
    setError("");
    setFieldErrors({});
    setOpen(true);
  }

  function openEdit(product: ProductRow) {
    setRecord(product);
    setVariants(product.product_variants?.length ? product.product_variants.map((variant) => ({ is_active: true, ...variant })) : [{ size: "", color: "", stock: 0, price: "", sale_price: "", sku: "", is_active: true }]);
    setBulkSizes(listToText(product.sizes));
    setBulkColors(listToText(product.colors));
    setError("");
    setFieldErrors({});
    setUploadProgress(null);
    setDraggedImageId(null);
    setDragOverImageId(null);
    setOpen(true);
  }

  function imageOrderAfterMove(fromIndex: number, toIndex: number) {
    const ids = sortedImages.map((image) => image.id);
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= ids.length || toIndex >= ids.length) return ids;
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    return ids;
  }

  async function reorderImage(fromIndex: number, toIndex: number) {
    if (!record.id || fromIndex === toIndex) return;
    await productAction({ id: record.id, imageAction: "reorder", imageOrder: imageOrderAfterMove(fromIndex, toIndex) });
  }

  async function handleImageDrop(event: DragEvent<HTMLDivElement>, targetImageId: string) {
    event.preventDefault();
    const sourceImageId = draggedImageId ?? event.dataTransfer.getData("text/plain");
    setDraggedImageId(null);
    setDragOverImageId(null);
    if (!sourceImageId || sourceImageId === targetImageId) return;
    const fromIndex = sortedImages.findIndex((image) => image.id === sourceImageId);
    const toIndex = sortedImages.findIndex((image) => image.id === targetImageId);
    await reorderImage(fromIndex, toIndex);
  }

  async function deleteImage(imageId: string) {
    if (!record.id) return;
    if (!window.confirm("Delete this product image? This removes it from the product and cannot be undone.")) return;
    await productAction({ id: record.id, imageAction: "delete", imageId });
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return [];
    const headers = await authHeaders();
    const uploadedImages = [];
    const fileList = Array.from(files);
    setUploadProgress({ current: 0, total: fileList.length });
    for (const [index, file] of fileList.entries()) {
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ folder: "products", contentType: file.type, fileName: file.name }),
      });
      const uploadResult = await readJson(uploadResponse);
      if (!uploadResponse.ok) throw new Error(uploadResult.error ?? "Unable to prepare image upload");
      const { uploadUrl, objectKey, imageUrl } = uploadResult.data;
      const putResponse = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putResponse.ok) throw new Error("Unable to upload image to Cloudflare R2. Check R2 CORS for PUT requests.");
      uploadedImages.push({ image_url: imageUrl, object_key: objectKey, file_size: file.size, mime_type: file.type });
      setUploadProgress({ current: index + 1, total: fileList.length });
    }
    return uploadedImages;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      const form = new FormData(event.currentTarget);
      if (!form.get("category_id")) {
        setFieldErrors({ category_id: "Category is required" });
        setSaving(false);
        return;
      }
      const images = await uploadImages(form.get("product_images") instanceof File ? (event.currentTarget.elements.namedItem("product_images") as HTMLInputElement).files : null);
      const payload = {
        id: record.id,
        name: form.get("name"),
        slug: form.get("slug"),
        description: form.get("description"),
        price: form.get("price"),
        sale_price: form.get("sale_price"),
        discount_percent: form.get("discount_percent"),
        category_id: form.get("category_id"),
        collection_id: form.get("collection_id"),
        drop_id: form.get("drop_id"),
        stock: form.get("stock"),
        sku: form.get("sku"),
        barcode: form.get("barcode"),
        sizes: form.get("sizes"),
        colors: form.get("colors"),
        is_active: form.get("is_active") === "on",
        is_archived: form.get("is_archived") === "on",
        is_featured: form.get("is_featured") === "on",
        is_new_drop: form.get("is_new_drop") === "on",
        is_archive_sale: form.get("is_archive_sale") === "on",
        new_drop_start_date: form.get("new_drop_start_date"),
        new_drop_end_date: form.get("new_drop_end_date"),
        meta_title: form.get("meta_title"),
        meta_description: form.get("meta_description"),
        images,
        variants,
      };
      const headers = await authHeaders();
      const response = await fetch("/api/admin/products", {
        method: record.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error ?? "Unable to save product");
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  }

  async function productAction(body: Record<string, unknown>) {
    setImageSaving(true);
    setError("");
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error ?? "Unable to update product image");
      setRecord(result.data);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update product image");
    } finally {
      setImageSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!window.confirm("Archive/delete product? This hides the product from customers but keeps its images and data for restore.")) return;
    const headers = await authHeaders();
    const response = await fetch("/api/admin/products", { method: "DELETE", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ id }) });
    if (!response.ok) {
      const result = await readJson(response);
      setError(result.error ?? "Unable to archive product");
      return;
    }
    await load();
  }

  async function restoreProduct(id: string) {
    const headers = await authHeaders();
    const response = await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ id, action: "restore" }) });
    const result = await readJson(response);
    if (!response.ok) {
      setError(result.error ?? "Unable to restore product");
      return;
    }
    await load();
  }

  function updateVariant(index: number, key: keyof ProductVariant, value: string | boolean) {
    setVariants((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }

  function removeVariant(index: number) {
    setVariants((items) => items.map((item, itemIndex) => itemIndex === index && item.id ? { ...item, _delete: true } : item).filter((item, itemIndex) => itemIndex !== index || item.id));
  }

  function duplicateVariant(index: number) {
    setVariants((items) => {
      const source = items[index];
      if (!source) return items;
      const copy = { ...source, id: undefined, sku: source.sku ? `${source.sku}-copy` : "", _delete: false };
      return [...items.slice(0, index + 1), copy, ...items.slice(index + 1)];
    });
  }

  function splitCsv(value: string) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  function generateBulkVariants() {
    const sizes = splitCsv(bulkSizes);
    const colors = splitCsv(bulkColors);
    if (sizes.length === 0 || colors.length === 0) {
      setError("Enter at least one size and one color to bulk-generate variants.");
      return;
    }
    const existingKeys = new Set(variants.filter((variant) => !variant._delete).map((variant) => `${(variant.color ?? "").trim().toLowerCase()}:${(variant.size ?? "").trim().toLowerCase()}`));
    const generated = colors.flatMap((color) => sizes.map((size) => ({ size, color, stock: 0, price: "", sale_price: "", sku: `${color}-${size}`, is_active: true }))).filter((variant) => !existingKeys.has(`${variant.color.toLowerCase()}:${variant.size.toLowerCase()}`));
    setVariants((items) => [...items, ...generated]);
    setError("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold">Products</h1><p className="text-sm text-muted-foreground">Manage schema-aligned products, images, thumbnails, and variants.</p></div><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} />Show archived</label><Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add product</Button></div></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Collection</th><th className="px-4 py-3 font-medium">Drop</th><th className="px-4 py-3 font-medium">Stock</th><th className="px-4 py-3 font-medium">Flags</th><th className="px-4 py-3" /></tr></thead><tbody>{loading ? <tr><td className="px-4 py-8 text-muted-foreground" colSpan={7}>Loading products…</td></tr> : products.length === 0 ? <tr><td className="px-4 py-8 text-muted-foreground" colSpan={7}>No products yet.</td></tr> : products.map((product) => { const isDeleted = Boolean(product.deleted_at); return <tr key={product.id} className="border-b last:border-0"><td className="px-4 py-3 font-medium">{product.name}{isDeleted && <span className="ml-2 text-xs text-muted-foreground">Archived</span>}</td><td className="px-4 py-3">{product.categories?.name ?? "—"}</td><td className="px-4 py-3">{product.collections?.name ?? "—"}</td><td className="px-4 py-3">{product.drops?.name ?? "—"}</td><td className="px-4 py-3">{product.stock ?? 0}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-1">{product.is_featured && <Badge>Featured</Badge>}{product.is_new_drop && <Badge variant="secondary">New</Badge>}{product.is_archive_sale && <Badge variant="destructive">Sale</Badge>}{isDeleted && <Badge variant="outline">Archived</Badge>}</div></td><td className="px-4 py-3 text-right whitespace-nowrap"><Button variant="ghost" size="icon" onClick={() => openEdit(product)}><Pencil className="h-4 w-4" /></Button>{isDeleted ? <Button variant="ghost" size="icon" onClick={() => restoreProduct(product.id)}><ArchiveRestore className="h-4 w-4" /></Button> : <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>}</td></tr>; })}</tbody></table></CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[94vh] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] overflow-y-auto p-4 sm:w-[calc(100%-2rem)] sm:max-w-[calc(100%-2rem)] sm:p-6 lg:max-w-6xl xl:max-w-7xl"><DialogHeader><DialogTitle>{record.id ? "Edit product" : "Add product"}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-6 pb-2">
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label>Name</Label><Input name="name" defaultValue={record.name ?? ""} required /></div><div className="space-y-1.5"><Label>Slug</Label><Input name="slug" defaultValue={record.slug ?? ""} required /></div><div className="space-y-1.5 md:col-span-2"><Label>Description</Label><Textarea name="description" defaultValue={record.description ?? ""} required /></div><div className="space-y-1.5"><Label>Price (MMK)</Label><Input name="price" type="number" defaultValue={record.price ?? ""} required /></div><div className="space-y-1.5"><Label>Sale price</Label><Input name="sale_price" type="number" defaultValue={record.sale_price ?? ""} /></div><div className="space-y-1.5"><Label>Discount percent</Label><Input name="discount_percent" type="number" defaultValue={record.discount_percent ?? 0} /></div><div className="space-y-1.5"><Label>Stock</Label><Input name="stock" type="number" defaultValue={record.stock ?? 0} /></div><div className="space-y-1.5"><Label>Category</Label><SearchableSelect name="category_id" value={record.category_id ?? ""} options={categories} placeholder="Select category" searchPlaceholder="Search categories..." loading={optionsLoading} loadingText="Loading categories..." emptyText="No categories found" required error={fieldErrors.category_id} onChange={(value) => { setRecord((current) => ({ ...current, category_id: value })); setFieldErrors((current) => ({ ...current, category_id: "" })); }} /></div><div className="space-y-1.5"><Label>Collection</Label><SearchableSelect name="collection_id" value={record.collection_id ?? ""} options={collections} placeholder="No collection" searchPlaceholder="Search collections..." loading={optionsLoading} loadingText="Loading collections..." emptyText="No collections found" onChange={(value) => setRecord((current) => ({ ...current, collection_id: value }))} /></div><div className="space-y-1.5"><Label>Drop</Label><SearchableSelect name="drop_id" value={record.drop_id ?? ""} options={drops} placeholder="No drop" searchPlaceholder="Search drops..." loading={optionsLoading} loadingText="Loading drops..." emptyText="No drops found" onChange={(value) => setRecord((current) => ({ ...current, drop_id: value }))} /></div><div className="space-y-1.5"><Label>SKU</Label><Input name="sku" defaultValue={record.sku ?? ""} /></div><div className="space-y-1.5"><Label>Barcode</Label><Input name="barcode" defaultValue={record.barcode ?? ""} /></div><div className="space-y-1.5"><Label>Sizes</Label><Input name="sizes" defaultValue={listToText(record.sizes)} placeholder="S, M, L" /></div><div className="space-y-1.5"><Label>Colors</Label><Input name="colors" defaultValue={listToText(record.colors)} placeholder="Black, Cream" /></div><div className="space-y-1.5"><Label>New drop start</Label><Input name="new_drop_start_date" type="datetime-local" defaultValue={formatInputDate(record.new_drop_start_date)} /></div><div className="space-y-1.5"><Label>New drop end</Label><Input name="new_drop_end_date" type="datetime-local" defaultValue={formatInputDate(record.new_drop_end_date)} /></div><div className="space-y-1.5"><Label>Meta title</Label><Input name="meta_title" defaultValue={record.meta_title ?? ""} /></div><div className="space-y-1.5 md:col-span-2"><Label>Meta description</Label><Textarea name="meta_description" defaultValue={record.meta_description ?? ""} /></div></div>

        <div className="grid gap-3 sm:grid-cols-5"><label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={Boolean(record.is_active)} />Active</label><label className="flex items-center gap-2 text-sm"><input name="is_archived" type="checkbox" defaultChecked={Boolean(record.is_archived)} />Archived</label><label className="flex items-center gap-2 text-sm"><input name="is_featured" type="checkbox" defaultChecked={Boolean(record.is_featured)} />Featured</label><label className="flex items-center gap-2 text-sm"><input name="is_new_drop" type="checkbox" defaultChecked={Boolean(record.is_new_drop)} />New drop</label><label className="flex items-center gap-2 text-sm"><input name="is_archive_sale" type="checkbox" defaultChecked={Boolean(record.is_archive_sale)} />Archive sale</label></div>

        <div className="space-y-3"><div><Label>Product images</Label><Input name="product_images" type="file" accept="image/*" multiple className="mt-1" disabled={saving} /><p className="mt-1 text-xs text-muted-foreground">New uploads append to the existing product images.</p>{uploadProgress && <p role="status" className="mt-1 text-xs text-muted-foreground">Uploading image {uploadProgress.current} of {uploadProgress.total} to R2…</p>}{imageSaving && <p role="status" className="mt-1 text-xs text-muted-foreground">Saving image changes…</p>}</div>{record.id && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Product image order">{sortedImages.length === 0 ? <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"><ImageIcon className="mx-auto mb-2 h-6 w-6" />No images yet</div> : sortedImages.map((image, index) => <div key={image.id} draggable onDragStart={(event) => { setDraggedImageId(image.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", image.id); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDragOverImageId(image.id); }} onDragLeave={() => setDragOverImageId((current) => current === image.id ? null : current)} onDrop={(event) => handleImageDrop(event, image.id)} onDragEnd={() => { setDraggedImageId(null); setDragOverImageId(null); }} className={cn("overflow-hidden rounded-lg border bg-card transition", draggedImageId === image.id && "opacity-60", dragOverImageId === image.id && "border-primary ring-2 ring-primary/30")} aria-label={`Product image ${index + 1}. Drag to reorder.`}><div className="relative aspect-square bg-muted"><img src={image.image_url} alt="Product" className="h-full w-full object-contain p-2" />{image.is_thumbnail && <Badge className="absolute left-2 top-2"><Star className="mr-1 h-3 w-3" />Thumbnail</Badge>}</div><div className="grid grid-cols-4 gap-1 p-2"><Button type="button" variant="outline" size="icon" aria-label="Move image earlier" disabled={index === 0 || imageSaving} onClick={() => reorderImage(index, index - 1)}><ArrowUp className="h-3 w-3" /></Button><Button type="button" variant="outline" size="icon" aria-label="Move image later" disabled={index === sortedImages.length - 1 || imageSaving} onClick={() => reorderImage(index, index + 1)}><ArrowDown className="h-3 w-3" /></Button><Button type="button" variant="outline" size="icon" aria-label="Set as primary thumbnail" disabled={imageSaving} onClick={() => productAction({ id: record.id, imageAction: "thumbnail", imageId: image.id })}><Star className="h-3 w-3" /></Button><Button type="button" variant="outline" size="icon" aria-label="Delete image" disabled={imageSaving} className="text-destructive" onClick={() => deleteImage(image.id)}><Trash2 className="h-3 w-3" /></Button></div></div>)}</div>}</div>

        <div className="space-y-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><Label>Product variants</Label><p className="text-xs text-muted-foreground">Bulk generation creates color-size SKUs like Black-S, Black-M, White-S, White-M.</p></div><div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"><Input placeholder="Sizes: S, M" value={bulkSizes} onChange={(event) => setBulkSizes(event.target.value)} /><Input placeholder="Colors: Black, White" value={bulkColors} onChange={(event) => setBulkColors(event.target.value)} /><Button type="button" variant="outline" size="sm" onClick={generateBulkVariants}>Generate</Button><Button type="button" variant="outline" size="sm" onClick={() => setVariants((items) => [...items, { size: "", color: "", stock: 0, price: "", sale_price: "", sku: "", is_active: true }])}><Plus className="mr-2 h-3 w-3" />Add variant</Button></div></div><div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[920px] text-sm"><thead><tr className="border-b text-left"><th className="px-3 py-2 font-medium">Size</th><th className="px-3 py-2 font-medium">Color</th><th className="px-3 py-2 font-medium">SKU</th><th className="px-3 py-2 font-medium">Price Override</th><th className="px-3 py-2 font-medium">Sale Price Override</th><th className="px-3 py-2 font-medium">Stock</th><th className="px-3 py-2 font-medium">Active</th><th className="px-3 py-2 font-medium">Actions</th></tr></thead><tbody>{variants.map((variant, index) => variant._delete ? null : <tr key={variant.id ?? index} className="border-b last:border-0"><td className="px-3 py-2"><Input placeholder="Size" value={variant.size ?? ""} onChange={(event) => updateVariant(index, "size", event.target.value)} /></td><td className="px-3 py-2"><Input placeholder="Color" value={variant.color ?? ""} onChange={(event) => updateVariant(index, "color", event.target.value)} /></td><td className="px-3 py-2"><Input placeholder="SKU" value={variant.sku ?? ""} onChange={(event) => updateVariant(index, "sku", event.target.value)} /></td><td className="px-3 py-2"><Input placeholder="Price" type="number" min="0" value={variant.price ?? ""} onChange={(event) => updateVariant(index, "price", event.target.value)} /></td><td className="px-3 py-2"><Input placeholder="Sale price" type="number" min="0" value={variant.sale_price ?? ""} onChange={(event) => updateVariant(index, "sale_price", event.target.value)} /></td><td className="px-3 py-2"><Input placeholder="Stock" type="number" min="0" step="1" value={variant.stock ?? 0} onChange={(event) => updateVariant(index, "stock", event.target.value)} /></td><td className="px-3 py-2"><input type="checkbox" checked={variant.is_active ?? true} onChange={(event) => updateVariant(index, "is_active", event.target.checked)} /></td><td className="px-3 py-2"><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => duplicateVariant(index)}><Copy className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeVariant(index)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table></div></div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save product"}
          </Button>
        </DialogFooter>
      </form></DialogContent></Dialog>
    </div>
  );
}
