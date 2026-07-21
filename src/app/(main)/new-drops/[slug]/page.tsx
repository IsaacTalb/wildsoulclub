import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Drop } from "@/types/product";

async function getDrop(slug: string): Promise<Drop | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/public/drops/${slug}`, { cache: "no-store" });
  if (!response.ok) return null;
  const json = await response.json();
  return json.data ?? null;
}

export default async function DropDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const drop = await getDrop(slug);
  if (!drop) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="relative mb-10 overflow-hidden rounded-2xl bg-muted p-8 text-center">
        {drop.banner_image_url && <Image src={drop.banner_image_url} alt={drop.name} fill sizes="100vw" className="object-cover opacity-30" />}
        <div className="relative z-10 mx-auto max-w-3xl">
          <Badge className="mb-4">{drop.status}</Badge>
          <h1 className="text-4xl font-bold md:text-5xl">{drop.name}</h1>
          {drop.release_date && <p className="mt-3 text-sm text-muted-foreground">Released {new Date(drop.release_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>}
          {drop.description && <p className="mt-4 text-lg text-muted-foreground">{drop.description}</p>}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(drop.products ?? []).map((product) => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <Card className="group overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                <div className="relative flex aspect-square items-center justify-center bg-muted">
                  {product.thumbnail_url ? <Image src={product.thumbnail_url} alt={product.name} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-contain" /> : <span className="text-sm text-muted-foreground/40">Product Image</span>}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold transition-colors group-hover:text-primary">{product.name}</h2>
                  <p className="mt-1 text-sm font-bold">{formatPrice(product.sale_price ?? product.price)}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
