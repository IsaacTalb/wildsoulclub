"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { ArrowRight, CalendarDays, RefreshCw, Sparkles, ChevronDown } from "lucide-react";
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

  const sortedDrops = useMemo(
    () =>
      [...newDrops].sort((a, b) => {
        const aDate = Date.parse(a.release_date || a.created_at || "") || 0;
        const bDate = Date.parse(b.release_date || b.created_at || "") || 0;
        return bDate - aDate;
      }),
    [newDrops],
  );

  if (error || (!loading && newDrops.length === 0)) {
    return (
      <div className="flex h-[calc(100vh-4rem)] h-[calc(100svh-4rem)] items-center justify-center bg-white px-6 text-center">
        <div className="max-w-md rounded-3xl border bg-white p-8 shadow-sm">
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
      className="bg-white]"
      aria-busy={loading}
    >
      {loading
        ? skeletonSections.map((item) => (
            <section
              key={item}
              className="relative min-h-[calc(100svh-var(--site-header-height))] overflow-hidden bg-white"
              aria-label="Loading release"
            >
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white via-neutral-100 to-white motion-reduce:animate-none" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-16">
                <div className="max-w-2xl space-y-4 rounded-2xl bg-white/20 p-5 backdrop-blur-sm">
                  <div className="h-4 w-32 animate-pulse rounded bg-white/50 motion-reduce:animate-none" />
                  <div className="h-12 w-3/4 animate-pulse rounded bg-white/50 motion-reduce:animate-none" />
                  <div className="h-20 w-full animate-pulse rounded bg-white/40 motion-reduce:animate-none" />
                </div>
              </div>
            </section>
          ))
        : sortedDrops.map((drop, index) => (
            <Fragment key={drop.id}>
            <section
              className={`relative isolate min-h-[calc(100svh-var(--site-header-height))] overflow-hidden bg-white ${drop.banner_image_url ? "text-white" : "text-foreground [&_h1]:!text-foreground [&_p]:!text-foreground [&_span]:!text-foreground"}`}
              aria-labelledby={`drop-${drop.id}`}
              style={{ height: "100vh" }}
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
              ) : null}
              {drop.banner_image_url ? <div className="absolute inset-0 -z-10 bg-black/18" /> : null}

              <div className="flex min-h-[calc(100svh-var(--site-header-height))] items-center justify-center px-5 py-10 text-center sm:px-10 lg:px-[max(4rem,8vw)]">
                <div className="mx-auto max-w-3xl">
                  <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-90 sm:text-sm">
                    <span>{drop.collections?.name || "Latest collection"}</span>
                    <span className="flex items-center gap-2 normal-case tracking-normal">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      {formatReleaseDate(drop.release_date)}
                    </span>
                  </div>
                  {/* {index === 0 && <p className="mb-2 text-sm font-medium text-white/75">Newest release</p>} */}
                  {/* <h1 id={`drop-${drop.id}`} className="text-4xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                    {drop.name}
                  </h1> */}
                  {/* <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                    {drop.description || "Discover the pieces in our latest curated release."}
                  </p> */}

                </div>
                {/* Scroll Down Button */}
                <div className="absolute inset-x-0 bottom-4 flex justify-center p-4 sm:bottom-8">
                  <button
                    onClick={() => {
                      const nextSection = document.getElementById(`drop-${drop.id}-products`);
                      nextSection?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="group flex flex-col items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] opacity-80 transition-opacity hover:opacity-100"
                    aria-label="Scroll down to next section"
                  >
                    <span>explore</span>
                    <ChevronDown className="h-5 w-5 animate-bounce transition-transform group-hover:translate-y-1" />
                  </button>
                </div>
              </div>
            </section>
            {(drop.products ?? []).length > 0 && (
              <section id={`drop-${drop.id}-products`} className="bg-white px-3 sm:px-4 md:px-8" aria-label={`${drop.name} products`}>
                {chunkFloatingProducts(drop.products ?? []).map((products, groupIndex) => (
                  <FloatingProductCanvas key={groupIndex} products={products} groupIndex={groupIndex} fullViewport compactSparse />
                ))}
                <footer className="flex min-h-[34vh] items-end justify-center pb-8 text-center sm:pb-12">
                  <div className="flex flex-col items-center">
                    <div className="relative h-20 w-40 overflow-hidden sm:h-32 sm:w-64">
                      <Image
                        src="/images/logo-black.png"
                        alt="Wild Soul Club"
                        fill
                        sizes="(min-width: 640px) 256px, 224px"
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-foreground sm:mt-3 sm:text-sm sm:tracking-[0.2em]">
                      {drop.collections?.name || "Latest collection"}
                    </p>
                  </div>
                </footer>
              </section>
            )}
            </Fragment>
          ))}
    </div>
  );
}
