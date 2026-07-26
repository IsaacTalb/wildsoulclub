import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicCollectionBySlug } from "@/lib/server/collections";
import { formatPrice } from "@/lib/utils";

export default async function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getPublicCollectionBySlug(slug);
  if (!collection) notFound();

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/collections" className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Collections
      </Link>
      <section className="relative mb-10 min-h-56 overflow-hidden rounded-2xl bg-muted p-8 sm:p-10">
        {collection.image_url ? <Image src={collection.image_url} alt="" fill priority sizes="100vw" className="object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/20" />
        <div className="relative max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Collection</p>
          <h1 className="text-3xl font-bold sm:text-5xl">{collection.name}</h1>
          {collection.description ? <p className="mt-4 text-muted-foreground">{collection.description}</p> : null}
        </div>
      </section>

      {collection.products.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center">
          <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No products in this collection yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Check back soon for new pieces.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collection.products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="group h-full overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-0">
                  <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-muted">
                    {product.thumbnail_url ? (
                      <Image src={product.thumbnail_url!} alt={product.name ?? "Product"} fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-contain transition-transform duration-300 group-hover:scale-105" />
                    ) : <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />}
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold transition-colors group-hover:text-primary">{product.name}</h2>
                    <p className="mt-1 text-sm font-bold">{formatPrice(product.sale_price ?? product.price ?? 0)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
