"use client";

import { type CSSProperties, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ShoppingCart } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import type { Drop, Product } from "@/types/product";
import {
  FloatingProductSkeleton,
  ResponsiveFloatingProductCanvases,
} from "@/components/products/floating-product-canvas";

const HERO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect width='20' height='20' fill='%23171717'/%3E%3C/svg%3E";

export default function HomePage() {
  const [latestDrop, setLatestDrop] = useState<Drop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch("/api/public/drops", { cache: "no-store", signal: controller.signal }),
      fetch("/api/public/products", { cache: "no-store", signal: controller.signal }),
    ])
      .then(async ([dropsResponse, productsResponse]) => {
        const dropsPayload: unknown = dropsResponse.ok
          ? await dropsResponse.json()
          : null;
        const productsPayload: unknown = productsResponse.ok
          ? await productsResponse.json()
          : null;
        const drops =
          typeof dropsPayload === "object" &&
          dropsPayload !== null &&
          "data" in dropsPayload &&
          Array.isArray(dropsPayload.data)
            ? (dropsPayload.data as Drop[])
            : [];
        const allProducts =
          typeof productsPayload === "object" &&
          productsPayload !== null &&
          "data" in productsPayload &&
          Array.isArray(productsPayload.data)
            ? (productsPayload.data as Product[])
            : [];

        setLatestDrop(drops[0] ?? null);
        setProducts(allProducts);
        setProductsError(!productsResponse.ok);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLatestDrop(null);
        setProducts([]);
        setProductsError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="bg-white">
      <Link
        href={`/new-drops/${latestDrop?.slug}`}
        className="block"
        aria-label={`View ${latestDrop?.name || "latest collection"}`}
      >
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
            className="-z-20 object-cover object-center md:[object-position:var(--drop-banner-position)]" style={{ "--drop-banner-position": `${latestDrop.banner_position_x ?? 50}% ${latestDrop.banner_position_y ?? 50}%` } as CSSProperties}
          />
        ) : (
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-neutral-700 via-neutral-950 to-black" />
        )}
        <div className="absolute inset-0 -z-10 bg-black/25" />

        {loading ? (
          <span className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white motion-reduce:animate-pulse" aria-label="Loading latest drop" />
        ) : (
          <Link
            href={`/new-drops/${latestDrop?.slug}`}
            className="inline-flex home-liquid-glass min-h-12 -translate-y-[calc(var(--site-header-height)/2)] items-center justify-center rounded-full px-2 py-2 text-sm font-bold uppercase text-white shadow-xl transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none"
          >
            {latestDrop?.name || "Latest collection"}
          </Link>
        )}
      </section>
      </Link>

      <section className="relative min-h-screen overflow-hidden bg-white px-4 md:px-8" aria-label="All products">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[45%] h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-[1600px]">
          {loading ? (
            <FloatingProductSkeleton />
          ) : productsError ? (
            <div className="flex min-h-[620px] items-center justify-center text-center">
              <div>
                <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="text-lg font-medium">Error loading products</h2>
                <p className="text-muted-foreground">Please try again later.</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-[620px] items-center justify-center">
              <div className="liquid-glass mx-auto max-w-md rounded-[2rem] px-6 py-16 text-center">
                <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h2 className="text-lg font-medium">No products found</h2>
                <p className="text-muted-foreground">New pieces are coming soon.</p>
              </div>
            </div>
          ) : (
            <ResponsiveFloatingProductCanvases products={products} />
          )}
        </div>

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
      </section>
    </main>
  );
}
