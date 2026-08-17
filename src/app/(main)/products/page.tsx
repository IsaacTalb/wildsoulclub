"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import type { Product } from "@/types/product";
import { FloatingProductSkeleton, ResponsiveFloatingProductCanvases } from "@/components/products/floating-product-canvas";

function ProductsContent() {
  const searchParams = useSearchParams();
  const requestQuery = searchParams.toString();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/products${requestQuery ? `?${requestQuery}` : ""}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setProducts(data.data || []);
        setError(null);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch products");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchProducts();
    return () => controller.abort();
  }, [requestQuery]);

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
    <div className="relative min-h-screen overflow-hidden bg-white px-4 md:px-8">
        <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[45%] h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-[1600px]">
        {/* Products Showcase */}
        {isInitialLoading ? (
          <FloatingProductSkeleton />
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
                <span className="rounded-full border border-black/5 bg-white/80 px-4 py-2 text-xs font-medium text-black/55 shadow-sm backdrop-blur-xl">
                  Updating products…
                </span>
              </div>
            )}

            <ResponsiveFloatingProductCanvases products={products} />
          </div>
        )}
      </section>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white"><FloatingProductSkeleton /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
