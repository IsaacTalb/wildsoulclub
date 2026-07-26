"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Search, ShoppingCart } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";

import styles from "./floating-products.module.css";

type CategoryOption = {
  id: string;
  name: string;
};

type FloatingStyle = CSSProperties & {
  "--float-delay": string;
  "--float-duration": string;
  "--product-rotation": string;
};

const PRODUCT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 25'%3E%3Crect width='20' height='25' fill='%23f5f5f5'/%3E%3Ccircle cx='10' cy='12.5' r='6' fill='%23e5e7eb'/%3E%3C/svg%3E";

const PRODUCTS_PER_CANVAS = 8;
const VISIBLE_PRODUCT_PREFETCH_LIMIT = PRODUCTS_PER_CANVAS;

const floatingProductLayouts = [
  {
    desktop: "md:left-[5%] md:top-[9%] md:w-[17%]",
    mobile: "left-[3%] top-[5%] w-[39%]",
    rotation: "-2deg",
    delay: "0s",
    duration: "7.2s",
  },
  {
    desktop: "md:left-[34%] md:top-[2%] md:w-[13%]",
    mobile: "right-[5%] top-[2%] w-[31%]",
    rotation: "2deg",
    delay: "-1.4s",
    duration: "8.4s",
  },
  {
    desktop: "md:left-[43%] md:top-[27%] md:w-[18%]",
    mobile: "left-[29%] top-[30%] w-[42%]",
    rotation: "0deg",
    delay: "-2.3s",
    duration: "7.8s",
  },
  {
    desktop: "md:right-[8%] md:top-[12%] md:w-[13%]",
    mobile: "right-[3%] top-[21%] w-[27%]",
    rotation: "3deg",
    delay: "-3.1s",
    duration: "9s",
  },
  {
    desktop: "md:left-[8%] md:top-[55%] md:w-[12%]",
    mobile: "left-[4%] top-[57%] w-[29%]",
    rotation: "-4deg",
    delay: "-0.8s",
    duration: "8.8s",
  },
  {
    desktop: "md:right-[18%] md:top-[45%] md:w-[16%]",
    mobile: "right-[6%] top-[52%] w-[36%]",
    rotation: "1deg",
    delay: "-4s",
    duration: "7.5s",
  },
  {
    desktop: "md:right-[-2%] md:top-[75%] md:w-[15%]",
    mobile: "right-[-5%] top-[77%] w-[34%]",
    rotation: "-2deg",
    delay: "-2.8s",
    duration: "9.4s",
  },
  {
    desktop: "md:left-[27%] md:top-[72%] md:w-[14%]",
    mobile: "left-[29%] top-[80%] w-[30%]",
    rotation: "3deg",
    delay: "-1.9s",
    duration: "8.1s",
  },
] as const;

const singleProductLayout = {
  desktop: "md:left-1/2 md:top-1/2 md:w-[24%]",
  mobile: "left-1/2 top-1/2 w-[65%]",
  rotation: "-2deg",
  delay: "0s",
  duration: "8s",
} as const;

function chunkProducts<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
}

function getProductImage(product: Product) {
  return (
    product.thumbnail_url ||
    product.product_images?.[0]?.url ||
    product.product_images?.[0]?.image_url ||
    product.product_images?.[0]?.object_key ||
    PRODUCT_IMAGE_PLACEHOLDER
  );
}

function getProductStatus(product: Product) {
  if (product.is_archived) {
    return { label: "Archive", unavailable: false };
  }

  if (product.is_active === false) {
    return { label: "Unavailable", unavailable: true };
  }

  if (product.stock != null && Number(product.stock) <= 0) {
    return { label: "Sold out", unavailable: true };
  }

  if (product.sale_price) {
    return { label: "Sale", unavailable: false };
  }

  if (product.is_new_drop) {
    return { label: "New", unavailable: false };
  }

  return null;
}

function ProductFloatingSkeleton() {
  return (
    <div
      aria-label="Loading products"
      aria-live="polite"
      className="relative h-[900px] w-full sm:h-[960px] md:h-[760px] lg:h-[820px]"
    >
      {floatingProductLayouts.map((layout, index) => {
        const animationStyle: FloatingStyle = {
          "--float-delay": layout.delay,
          "--float-duration": layout.duration,
          "--product-rotation": layout.rotation,
        };

        return (
          <div
            key={index}
            className={`absolute ${layout.mobile} ${layout.desktop}`}
            style={{ zIndex: 10 + (index % 4) }}
          >
            <div className={styles.floatingProduct} style={animationStyle}>
              <div className="aspect-square w-full animate-pulse rounded-[2rem] bg-black/[0.055] shadow-sm dark:bg-white/[0.07]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([
    { id: "all", name: "All Products" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (debouncedSearch) {
          params.append("search", debouncedSearch);
        }

        if (category !== "all") {
          params.append("category", category);
        }

        if (sort) {
          params.append("sort", sort);
        }

        const queryString = params.toString();
        const response = await fetch(
          `/api/public/products${queryString ? `?${queryString}` : ""}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        setProducts(data.data || []);
        setError(null);
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch products",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchProducts();

    return () => controller.abort();
  }, [debouncedSearch, category, sort]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/public/categories", {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = await response.json();

        setCategories([
          { id: "all", name: "All Products" },
          ...(data.data || []),
        ]);
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }
      }
    };

    void fetchCategories();

    return () => controller.abort();
  }, []);

  const productGroups = useMemo(
    () => chunkProducts(products, PRODUCTS_PER_CANVAS),
    [products],
  );

  const isInitialLoading = loading && products.length === 0;
  const isRefreshing = loading && products.length > 0;

  if (error && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-16 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Error loading products</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f7f5] px-4 dark:bg-neutral-950 md:px-8">
      <div className="liquid-orb right-0 top-52 h-80 w-80 bg-fuchsia-200/50 dark:bg-fuchsia-500/20" />
      <div className="liquid-orb bottom-10 left-1/3 h-64 w-64 bg-amber-200/50 dark:bg-amber-400/10" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[45%] h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 blur-3xl dark:bg-white/[0.025]" />
      </div>

      <section className="relative mx-auto max-w-[1600px]">
        {/* Filters */}
        <div className="liquid-glass sticky top-4 z-30 mb-8 grid gap-3 rounded-[1.5rem] p-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="h-12 rounded-full border-white/20 bg-white/20 pl-11 shadow-none backdrop-blur focus-visible:ring-1"
            />
          </div>

          <Select
            value={category}
            onValueChange={(value) => setCategory(value || "all")}
          >
            <SelectTrigger className="h-12 w-full rounded-full border-white/20 bg-white/20 md:w-[190px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((categoryOption) => (
                <SelectItem key={categoryOption.id} value={categoryOption.id}>
                  {categoryOption.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={(value) => setSort(value || "newest")}
          >
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
        {isInitialLoading ? (
          <ProductFloatingSkeleton />
        ) : products.length === 0 ? (
          <div className="flex min-h-[620px] items-center justify-center">
            <div className="liquid-glass mx-auto max-w-md rounded-[2rem] px-6 py-16 text-center">
              <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        ) : (
          <div
            className={`relative transition-opacity duration-300 ${
              isRefreshing ? "opacity-55" : "opacity-100"
            }`}
          >
            {error && (
              <div className="liquid-glass relative z-30 mb-4 rounded-[1.5rem] px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {isRefreshing && (
              <div className="pointer-events-none absolute inset-x-0 top-4 z-40 flex justify-center">
                <span className="rounded-full border border-black/5 bg-white/80 px-4 py-2 text-xs font-medium text-black/55 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/80 dark:text-white/55">
                  Updating products…
                </span>
              </div>
            )}

            {productGroups.map((group, groupIndex) => (
              <div
                key={`product-group-${groupIndex}`}
                className="relative h-[900px] w-full sm:h-[960px] md:h-[760px] lg:h-[820px]"
              >
                {group.map((product, index) => {
                  const layout =
                    group.length === 1
                      ? singleProductLayout
                      : floatingProductLayouts[index];

                  const status = getProductStatus(product);
                  const imageUrl = getProductImage(product);
                  const globalIndex = groupIndex * PRODUCTS_PER_CANVAS + index;

                  const animationStyle: FloatingStyle = {
                    "--float-delay": layout.delay,
                    "--float-duration": layout.duration,
                    "--product-rotation": layout.rotation,
                  };

                  return (
                    <div
                      key={product.id}
                      className={`absolute ${layout.mobile} ${layout.desktop} ${
                        group.length === 1
                          ? "-translate-x-1/2 -translate-y-1/2"
                          : ""
                      }`}
                      style={{ zIndex: 10 + (index % 4) }}
                    >
                      <div
                        className={styles.floatingProduct}
                        style={animationStyle}
                      >
                        <Link
                          href={`/products/${product.slug || product.id}`}
                          aria-label={`View ${product.name}`}
                          prefetch={
                            globalIndex < VISIBLE_PRODUCT_PREFETCH_LIMIT
                              ? null
                              : false
                          }
                          className="group relative block focus-visible:outline-none"
                        >
                          <div
                            className={`relative aspect-square w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:z-40 group-hover:scale-110 group-focus-visible:scale-110 ${
                              status?.unavailable
                                ? "opacity-65 grayscale-[20%]"
                                : ""
                            }`}
                          >
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              fill
                              unoptimized
                              sizes="(min-width: 768px) 20vw, 42vw"
                              placeholder="blur"
                              blurDataURL={PRODUCT_IMAGE_PLACEHOLDER}
                              preload={globalIndex === 0}
                              className="object-contain drop-shadow-[0_22px_25px_rgba(0,0,0,0.13)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-hover:drop-shadow-[0_35px_35px_rgba(0,0,0,0.18)] group-focus-visible:-translate-y-2"
                            />

                            {status && (
                              <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-black/65 opacity-0 shadow-sm backdrop-blur-xl transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 dark:border-white/10 dark:bg-neutral-900/80 dark:text-white/65 md:text-[10px]">
                                {status.label}
                              </span>
                            )}
                          </div>

                          <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-max max-w-[190px] -translate-x-1/2 translate-y-2 rounded-2xl border border-black/[0.06] bg-white/85 px-4 py-3 text-center opacity-0 shadow-[0_16px_45px_rgba(0,0,0,0.09)] backdrop-blur-2xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 dark:border-white/10 dark:bg-neutral-900/85">
                            <p className="line-clamp-1 text-xs font-medium text-black/80 dark:text-white/80">
                              {product.name}
                            </p>

                            <p className="mt-1 line-clamp-1 text-[9px] uppercase tracking-[0.18em] text-black/35 dark:text-white/35">
                              {product.categories?.name ||
                                product.category ||
                                "Wild Soul"}
                            </p>

                            <div className="mt-2 flex items-center justify-center gap-2">
                              {product.sale_price ? (
                                <>
                                  <span className="text-[11px] font-semibold text-black dark:text-white">
                                    {formatPrice(product.sale_price)}
                                  </span>
                                  <span className="text-[10px] text-black/35 line-through dark:text-white/35">
                                    {formatPrice(product.price)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[11px] font-semibold text-black dark:text-white">
                                  {formatPrice(product.price)}
                                </span>
                              )}
                            </div>

                            <ArrowUpRight className="mx-auto mt-2 h-3.5 w-3.5 text-black/40 dark:text-white/40" />
                          </div>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
