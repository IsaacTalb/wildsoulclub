"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  banner_color: string;
  product_count: number;
  products?: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/public/collections");
        if (!res.ok) throw new Error("Failed to fetch collections");
        const data = await res.json();
        setCollections(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch collections");
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h3 className="text-lg font-medium">Error loading collections</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Collections</h1>
        <p className="text-muted-foreground mt-2">Explore our curated collections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <div
            key={collection.id}
          >
            <Link href={`/collections/${collection.slug}`}>
              <Card className="group overflow-hidden border-0">
                <CardContent className="relative flex h-64 items-end bg-white p-0">
                  <div className="relative p-6 w-full">
                    <h3 className="h-14 line-clamp-2 overflow-hidden text-xl font-bold leading-7">{collection.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      {/* <span className="text-xs text-muted-foreground">{collection.product_count || 0} Products</span> */}
                      <span className="inline-flex items-center gap-1 text-sm text-foreground transition-transform group-hover:translate-x-1">
                        Explore <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
