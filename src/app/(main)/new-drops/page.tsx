"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ArchiveSaleProduct } from "@/types/product";

export default function NewDropsPage() {
  const [newDrops, setNewDrops] = useState<ArchiveSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewDrops = async () => {
      try {
        const res = await fetch("/api/new-drops");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setNewDrops(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch new drops");
      } finally {
        setLoading(false);
      }
    };

    fetchNewDrops();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Fresh off the press
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">New Drops</h1>
          <p className="text-muted-foreground">Loading latest drops...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Fresh off the press
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">New Drops</h1>
          <p className="text-muted-foreground">Failed to load drops. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Sparkles className="h-4 w-4" />
          Fresh off the press
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">New Drops</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Be the first to rock our latest styles — fresh drops every month.
        </p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {newDrops.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.random() * 0.3 }}
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
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                      New Drop
                    </Badge>
                    {item.sale_price && (
                      <Badge variant="destructive" className="absolute top-3 right-3">
                        Sale
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      {item.category || "Uncategorized"}
                    </p>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {item.sale_price ? (
                        <>
                          <span className="text-sm font-bold text-primary">
                            {formatPrice(item.sale_price)}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(item.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold">
                          {formatPrice(item.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.new_drop_start_date ? (
                        new Date(item.new_drop_start_date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        "Available now"
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        className="mt-16 text-center py-12 px-4 rounded-xl bg-muted/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-2">Want early access?</h2>
        <p className="text-muted-foreground mb-6">Sign up for notifications on our next drop.</p>
        <Link href="/sign-up">
          <Button size="lg">
            Notify Me <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
