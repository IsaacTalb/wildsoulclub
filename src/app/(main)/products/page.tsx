"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ShoppingCart, Loader2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types/product";

const categories = [
  { id: "all", name: "All Products" },
  { id: "1", name: "T-Shirts" },
  { id: "2", name: "Hoodies" },
  { id: "3", name: "Accessories" },
  { id: "4", name: "Outerwear" },
  { id: "5", name: "Bottoms" },
];

const floatLayouts = [
  { x: "0px", y: "24px", rotate: "-2.5deg" },
  { x: "18px", y: "-10px", rotate: "1.8deg" },
  { x: "-14px", y: "42px", rotate: "2.8deg" },
  { x: "10px", y: "8px", rotate: "-1.2deg" },
  { x: "-20px", y: "-20px", rotate: "1.4deg" },
  { x: "24px", y: "34px", rotate: "-2deg" },
];


export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (category !== "all") params.append("category", category);
        if (sort) params.append("sort", sort);

        const res = await fetch(`/api/public/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, category, sort]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Error loading products</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 md:px-8">
      <div className="liquid-orb -top-20 left-10 h-72 w-72 bg-sky-200/60 dark:bg-sky-500/20" />
      <div className="liquid-orb right-0 top-52 h-80 w-80 bg-fuchsia-200/50 dark:bg-fuchsia-500/20" />
      <div className="liquid-orb bottom-10 left-1/3 h-64 w-64 bg-amber-200/50 dark:bg-amber-400/10" />

      <section className="relative mx-auto max-w-7xl">
        <div className="liquid-glass mb-8 rounded-[2rem] px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1 uppercase tracking-[0.24em]">
                Wild Soul Shop
              </Badge>
              <h1 className="text-4xl font-black tracking-[-0.06em] md:text-6xl lg:text-7xl">
                Floating fits for wild souls.
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-base">
                A liquid-glass product wall inspired by editorial streetwear showcases — loose, floating,
                asymmetric, and built around your Supabase product data.
              </p>
            </div>
            <div className="liquid-pill flex items-center gap-2 self-start px-4 py-3 text-sm text-muted-foreground lg:self-end">
              <SlidersHorizontal className="h-4 w-4" />
              {products.length} pieces loaded
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="liquid-glass sticky top-20 z-30 mb-12 grid gap-3 rounded-[1.5rem] p-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="h-12 rounded-full border-white/20 bg-white/20 pl-11 shadow-none backdrop-blur focus-visible:ring-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={(value) => setCategory(value || "all")}>
            <SelectTrigger className="h-12 w-full rounded-full border-white/20 bg-white/20 md:w-[190px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value || "newest")}>
            <SelectTrigger className="h-12 w-full rounded-full border-white/20 bg-white/20 md:w-[190px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Showcase */}
        {products.length === 0 ? (
          <div className="liquid-glass mx-auto max-w-md rounded-[2rem] px-6 py-16 text-center">
            <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-14 pb-20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => {
              const float = floatLayouts[index % floatLayouts.length];
              const imageUrl = product.product_images?.[0]?.url || product.product_images?.[0]?.object_key;

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="floating-product-card group block"
                  style={{
                    "--float-x": float.x,
                    "--float-y": float.y,
                    "--float-rotate": float.rotate,
                  } as React.CSSProperties}
                >
                  <article className="liquid-glass overflow-hidden rounded-[2rem] p-3">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-white/35 dark:bg-white/10">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-full w-full object-contain p-5 transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground/50">
                          Product Image
                        </div>
                      )}
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                        {product.sale_price ? (
                          <Badge className="rounded-full bg-red-500">SALE</Badge>
                        ) : <span />}
                        {product.is_new && (
                          <Badge className="rounded-full" variant="secondary">NEW</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3 px-2 py-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {product.category || "Wild Soul"}
                        </p>
                        <h3 className="mt-1 text-lg font-black tracking-tight group-hover:text-primary">
                          {product.name}
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          {product.sale_price ? (
                            <>
                              <span className="font-semibold">{formatPrice(product.sale_price)}</span>
                              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>
                            </>
                          ) : (
                            <span className="font-semibold">{formatPrice(product.price)}</span>
                          )}
                        </div>
                      </div>
                      <span className="liquid-pill inline-flex h-10 w-10 shrink-0 items-center justify-center">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}