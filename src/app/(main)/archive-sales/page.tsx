"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Percent, ArrowRight, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ArchiveSaleProduct } from "@/types/product";

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-destructive" />
        </div>
      </div>
    );
  }

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
        {archiveSales.map((item) => (
          <div
            key={item.id}
          >
            <Link href={`/products/${item.id}`}>
              <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted relative flex items-center justify-center">
                    {item.product_images?.[0] ? (
                      <img
                        src={`${process.env.R2_PUBLIC_BASE_URL}/${item.product_images[0].object_key}`}
                        alt={item.name}
                        className="object-contain w-full h-full"
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
                      {item.category || "Uncategorized"}
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
