import Image from "next/image";
import { notFound } from "next/navigation";

import { FloatingProductCanvas, chunkFloatingProducts } from "@/components/products/floating-product-canvas";
import { getPublicDropBySlug } from "@/lib/server/drops";

export default async function DropDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const drop = await getPublicDropBySlug(slug);
  if (!drop) notFound();

  const groups = chunkFloatingProducts(drop.products ?? []);
  return (
    <div className="overflow-hidden bg-white">
      <section className={`relative isolate flex min-h-[calc(100vh-var(--site-header-height))] min-h-[calc(100svh-var(--site-header-height))] items-end overflow-hidden bg-white px-5 py-10 sm:px-10 lg:px-[max(4rem,8vw)] lg:py-16 ${drop.banner_image_url ? "text-white" : "text-foreground"}`} aria-labelledby="drop-title">
        {drop.banner_image_url ? (
          <>
            <Image src={drop.banner_image_url} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/95 via-black/35 to-black/15" />
          </>
        ) : null}
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-70">{drop.collections?.name || "Wild Soul Club"}</p>
          <h1 id="drop-title" className="mt-3 text-5xl font-bold leading-none tracking-tight sm:text-7xl">{drop.name}</h1>
          {drop.description && <p className="mt-5 max-w-2xl text-lg opacity-80">{drop.description}</p>}
        </div>
      </section>
      <section aria-label={`${drop.name} products`} className="mx-auto max-w-[1600px] px-4 md:px-8">
        {groups.length ? groups.map((products, index) => <FloatingProductCanvas key={index} products={products} groupIndex={index} />) : <div className="flex min-h-[50vh] items-center justify-center px-6 text-center text-muted-foreground">No products have been added to this drop yet.</div>}
      </section>
    </div>
  );
}
