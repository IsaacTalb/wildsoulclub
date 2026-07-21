"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Percent, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ArchiveSaleProduct } from "@/types/product";

const PRODUCT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect width='20' height='20' fill='%23f5f5f5'/%3E%3Ccircle cx='10' cy='10' r='6' fill='%23e5e7eb'/%3E%3C/svg%3E";
const skeletonCards = Array.from({ length: 4 }, (_, index) => index);

export default function ArchiveSalesPage() {
  const [archiveSales, setArchiveSales] = useState<ArchiveSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArchiveSales = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/archive-sales");
        if (!res.ok) throw new Error("Failed to fetch archive sales");
        const data = await res.json();
        setArchiveSales(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch archive sales");
      } finally {
        setLoading(false);
      }
    };

    fetchArchiveSales();
  }, []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Percent className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Error loading archive sales</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <div
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4">
          <Percent className="h-4 w-4" />
          Limited time offers
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Archive Sale</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Past season favourites at discounted prices — once they're gone, they're gone.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          skeletonCards.map((item) => (
            <Card key={item} className="overflow-hidden border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="aspect-square bg-muted p-6">
                  <div className="h-full w-full animate-pulse rounded-lg bg-background/60" />
                </div>
                <div className="space-y-3 p-4">
                  <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-3/4 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : archiveSales.map((item) => (
          <div
            key={item.id}
          >
            <Link href={`/products/${item.id}`}>
              <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted relative flex items-center justify-center">
                    {item.product_images?.[0] ? (
                      <Image
                        src={item.thumbnail_url || item.product_images[0].url || item.product_images[0].image_url || item.product_images[0].object_key}
                        alt={item.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        placeholder="blur"
                        blurDataURL={PRODUCT_IMAGE_PLACEHOLDER}
                        preload={false}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-muted-foreground/40 text-sm">Product Image</span>
                    )}
                    <Badge variant="destructive" className="absolute top-3 left-3">
                      -{item.discount || Math.round(((item.price - item.sale_price) / item.price) * 100)}%
                    </Badge>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      {item.categories?.name || item.category || "Uncategorized"}
                    </p>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-destructive">
                        {formatPrice(item.sale_price)}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      Save {formatPrice(item.price - item.sale_price)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className="mt-16 text-center py-12 px-4 rounded-xl bg-muted/50"
      >
        <h2 className="text-2xl font-bold mb-2">Don't miss out!</h2>
        <p className="text-muted-foreground mb-6">
          These archive deals won't last forever. Grab them while you can.
        </p>
        <Link href="/collections">
          <Button variant="outline" size="lg">
            View All Collections <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
