"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Drop } from "@/types/product";
import {
  FloatingProductSkeleton,
  ResponsiveFloatingProductCanvases,
} from "@/components/products/floating-product-canvas";

const HERO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect width='20' height='20' fill='%23171717'/%3E%3C/svg%3E";

export default function HomePage() {
  const [latestDrop, setLatestDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/public/drops", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load the latest drop");
        const payload: unknown = await response.json();
        const drops =
          typeof payload === "object" &&
          payload !== null &&
          "data" in payload &&
          Array.isArray(payload.data)
            ? (payload.data as Drop[])
            : [];

        setLatestDrop(drops[0] ?? null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLatestDrop(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const products = latestDrop?.products ?? [];

  return (
    <main className="bg-white">
      <section className="relative isolate flex h-[calc(100svh-env(safe-area-inset-bottom))] min-h-[32rem] items-center justify-center overflow-hidden bg-neutral-950 px-5 pt-[var(--site-header-height)]">
        {latestDrop?.banner_image_url ? (
          <Image
            src={latestDrop.banner_image_url}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            placeholder="blur"
            blurDataURL={HERO_PLACEHOLDER}
            preload
            className="-z-20 object-cover"
          />
        ) : (
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-neutral-700 via-neutral-950 to-black" />
        )}
        <div className="absolute inset-0 -z-10 bg-black/25" />

        {loading ? (
          <span className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white motion-reduce:animate-pulse" aria-label="Loading latest drop" />
        ) : (
          <Link
            href="/new-drops"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 bg-white px-8 py-3 text-sm font-bold uppercase tracking-[0.16em] text-black shadow-xl transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none"
          >
            View Products
          </Link>
        )}
      </section>

      <section className="bg-white px-3 sm:px-4 md:px-8" aria-label="Latest drop products">
        {loading ? (
          <FloatingProductSkeleton />
        ) : products.length > 0 ? (
          <ResponsiveFloatingProductCanvases products={products} compactSparse />
        ) : (
          <div className="flex min-h-[45vh] items-center justify-center px-6 text-center text-sm font-medium uppercase tracking-[0.16em] text-black/50">
            New pieces are coming soon.
          </div>
        )}

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
          </div>
        </footer>
      </section>
    </main>
  );
}
