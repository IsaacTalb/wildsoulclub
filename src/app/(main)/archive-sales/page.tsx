"use client";

import { useEffect, useMemo, useState } from "react";
import { FloatingProductCanvas, FloatingProductSkeleton, chunkFloatingProducts } from "@/components/products/floating-product-canvas";
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

  const groups = useMemo(() => chunkFloatingProducts(products), [products]);
  return (
    <div className="overflow-hidden bg-[#f7f7f5] px-4 dark:bg-neutral-950 md:px-8">
      <section className="mx-auto max-w-[1600px]" aria-label="Archive sale products">
        {loading ? <FloatingProductSkeleton /> : error ? <div className="flex min-h-[60vh] items-center justify-center text-center text-muted-foreground">{error}. Please try again later.</div> : groups.length ? groups.map((group, index) => <FloatingProductCanvas key={index} products={group} groupIndex={index} />) : <div className="flex min-h-[60vh] items-center justify-center text-center text-muted-foreground">There are no archive-sale pieces available right now.</div>}
      </section>
      <footer className="flex min-h-[34vh] items-end justify-center pb-8 pt-16 text-center sm:pb-12">
        <p className="text-[clamp(2.5rem,10vw,9rem)] font-black leading-[0.78] tracking-[-0.08em] text-foreground" aria-label="Wild Soul Club">WILD SOUL<br />CLUB</p>
      </footer>
    </div>
  );
}
