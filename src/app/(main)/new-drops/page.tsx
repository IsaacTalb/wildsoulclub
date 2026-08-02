"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { ArrowRight, CalendarDays, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Drop } from "@/types/product";
import { FloatingProductCanvas, chunkFloatingProducts } from "@/components/products/floating-product-canvas";

const DROP_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect width='20' height='20' fill='%23171717'/%3E%3C/svg%3E";
const skeletonSections = Array.from({ length: 2 }, (_, index) => index);

function formatReleaseDate(releaseDate?: string) {
  if (!releaseDate) return "Release date coming soon";

  return new Date(releaseDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function NewDropsPage() {
  const [newDrops, setNewDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchNewDrops = async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await fetch("/api/new-drops");
      if (!response.ok) throw new Error("Failed to fetch drops");
      const payload: unknown = await response.json();
      const drops =
        typeof payload === "object" && payload !== null && "data" in payload && Array.isArray(payload.data)
          ? (payload.data as Drop[])
          : [];
      setNewDrops(drops);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/new-drops", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to fetch drops");
        const payload: unknown = await response.json();
        const drops =
          typeof payload === "object" && payload !== null && "data" in payload && Array.isArray(payload.data)
            ? (payload.data as Drop[])
            : [];
        setNewDrops(drops);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (error || (!loading && newDrops.length === 0)) {
    return (
      <div className="flex h-[calc(100vh-4rem)] h-[calc(100svh-4rem)] items-center justify-center bg-muted/30 px-6 text-center">
        <div className="max-w-md rounded-3xl border bg-background/90 p-8 shadow-sm">
          <Sparkles className="mx-auto mb-5 h-9 w-9 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold tracking-tight">{error ? "The drops got away" : "The next release is taking shape"}</h1>
          <p className="mt-3 text-muted-foreground">
            {error
              ? "We couldn’t load the latest releases. Check your connection and try once more."
              : "There aren’t any active or scheduled drops right now. Check back soon for what’s next."}
          </p>
          {error && (
            <Button className="mt-6" onClick={fetchNewDrops} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              {loading ? "Trying again…" : "Try again"}
            </Button>
          )}
          {!error && (
            <Button className="mt-6" asChild>
              <Link href="/products">
                Explore the shop <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-4rem)] h-[calc(100svh-4rem)] overflow-y-auto snap-y snap-mandatory motion-reduce:snap-none"
      aria-busy={loading}
    >
      {loading
        ? skeletonSections.map((item) => (
            <section
              key={item}
              className="relative min-h-full snap-start snap-always overflow-hidden bg-muted motion-reduce:snap-normal"
              aria-label="Loading release"
            >
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted motion-reduce:animate-none" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-16">
                <div className="max-w-2xl space-y-4 rounded-2xl bg-background/20 p-5 backdrop-blur-sm">
                  <div className="h-4 w-32 animate-pulse rounded bg-background/50 motion-reduce:animate-none" />
                  <div className="h-12 w-3/4 animate-pulse rounded bg-background/50 motion-reduce:animate-none" />
                  <div className="h-20 w-full animate-pulse rounded bg-background/40 motion-reduce:animate-none" />
                </div>
              </div>
            </section>
          ))
        : newDrops.map((drop, index) => (
            <Fragment key={drop.id}>
            <section
              className="relative min-h-full snap-start snap-always isolate overflow-hidden bg-neutral-900 text-white motion-reduce:snap-normal"
              aria-labelledby={`drop-${drop.id}`}
            >
              {drop.banner_image_url ? (
                <Image
                  src={drop.banner_image_url}
                  alt=""
                  fill
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL={DROP_IMAGE_PLACEHOLDER}
                  preload={index === 0}
                  className="-z-20 object-cover"
                />
              ) : (
                <div className="absolute inset-0 -z-20 bg-gradient-to-br from-neutral-700 via-neutral-900 to-black" />
              )}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/95 via-black/35 to-black/20 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/45 sm:to-transparent" />

              <div className="flex min-h-[calc(100vh-4rem)] min-h-[calc(100svh-4rem)] items-end px-5 py-8 sm:px-10 sm:py-12 lg:px-[max(4rem,8vw)] lg:py-16">
                <div className="max-w-2xl">
                  <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80 sm:text-sm">
                    <span>{drop.collections?.name || "Latest collection"}</span>
                    <span className="flex items-center gap-2 normal-case tracking-normal">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      {formatReleaseDate(drop.release_date)}
                    </span>
                  </div>
                  {index === 0 && <p className="mb-2 text-sm font-medium text-white/75">Newest release</p>}
                  <h1 id={`drop-${drop.id}`} className="text-4xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                    {drop.name}
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                    {drop.description || "Discover the pieces in our latest curated release."}
                  </p>

                </div>
              </div>
            </section>
            {(drop.products ?? []).length > 0 && (
              <section className="bg-white px-4 md:px-8" aria-label={`${drop.name} products`}>
                {chunkFloatingProducts(drop.products ?? []).map((products, groupIndex) => (
                  <FloatingProductCanvas key={groupIndex} products={products} groupIndex={groupIndex} />
                ))}
              </section>
            )}
            </Fragment>
          ))}
    </div>
  );
}
