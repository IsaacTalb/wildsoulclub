"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import {
  FloatingProductSkeleton,
  ResponsiveFloatingProductCanvases,
} from "@/components/products/floating-product-canvas";
import type { Product } from "@/types/product";

export default function BestSellersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/public/products?best_seller=true", {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to fetch best sellers");
        const payload: unknown = await response.json();
        const data =
          typeof payload === "object" &&
          payload !== null &&
          "data" in payload &&
          Array.isArray(payload.data)
            ? (payload.data as Product[])
            : [];

        setProducts(data);
        setError(null);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch best sellers");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white px-4 md:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[45%] h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-[1600px]" aria-labelledby="best-sellers-heading">
        <h1 id="best-sellers-heading" className="sr-only">Best sellers</h1>
        {loading ? (
          <FloatingProductSkeleton />
        ) : products.length === 0 ? (
          <div className="flex min-h-[620px] items-center justify-center">
            <div className="liquid-glass mx-auto max-w-md rounded-[2rem] px-6 py-16 text-center">
              <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-lg font-medium">
                {error ? "Error loading best sellers" : "No best sellers yet"}
              </h2>
              <p className="text-muted-foreground">
                {error
                  ? error
                  : "Check back soon for the products selected by our team."}
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveFloatingProductCanvases products={products} />
        )}
      </section>

      <footer className="relative flex min-h-[24vh] items-end justify-center pb-8 text-center sm:pb-12">
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
          <p className="text-xs font-bold uppercase text-black/50 sm:text-sm">
            BOLD PRINT, STREET IDENTITY
          </p>
          <p className="text-xs font-bold uppercase text-black/50 sm:text-sm">
            EST - 2023
          </p>
        </div>
      </footer>
      <Footer />
    </div>
  );
}
