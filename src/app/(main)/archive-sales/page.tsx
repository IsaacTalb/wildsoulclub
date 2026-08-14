"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FloatingProductSkeleton, ResponsiveFloatingProductCanvases } from "@/components/products/floating-product-canvas";
import type { ArchiveSaleProduct } from "@/types/product";

export default function ArchiveSalesPage() {
  const [products, setProducts] = useState<ArchiveSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/archive-sales", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load archive products");
        const payload = await response.json();
        setProducts(payload.data || []);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Failed to load archive products");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return (
    <div className="overflow-hidden bg-white px-4 md:px-8">
      <section className="mx-auto max-w-[1600px]" aria-label="Archive sale products">
        {loading ? <FloatingProductSkeleton /> : error ? <div className="flex min-h-[60vh] items-center justify-center text-center text-muted-foreground">{error}. Please try again later.</div> : products.length ? <ResponsiveFloatingProductCanvases products={products} /> : <div className="flex min-h-[60vh] items-center justify-center text-center text-muted-foreground">There are no archive-sale pieces available right now.</div>}
      </section>
      <footer className="flex min-h-[24vh] items-end justify-center pb-8 text-center sm:pb-12">
        <div className="flex flex-col items-center">
          <div className="relative h-8 w-14 overflow-hidden sm:h-11 sm:w-20">
            <Image
              src="/images/logo-black.png"
              alt="Wild Soul Club"
              fill
              sizes="(min-width: 640px) 80px, 56px"
              className="object-contain opacity-50"
            />
          </div>

          <p className="text-xs font-bold uppercase text-black/50 sm:mt-3 sm:text-sm">
            BOLD PRINT, STREET IDENTITY
          </p>

          <p className="text-xs font-bold uppercase text-black/50 sm:text-sm">
            Wild Soul Club's Archives
          </p>
        </div>
      </footer>
    </div>
  );
}
