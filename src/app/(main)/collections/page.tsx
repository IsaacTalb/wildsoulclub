"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/public/collections");
        if (!res.ok) throw new Error("Failed to fetch collections");
        const data = await res.json();
        setCollections(data.data || []);
      } catch (err) {
        setError(err.message);
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
        {collections.map((collection, index) => (
          <motion.div
            key={collection.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/collections/${collection.slug}`}>
              <Card className="group overflow-hidden border-0">
                <CardContent className={`p-0 relative h-64 ${collection.banner_color || 'bg-slate-800'} flex items-end`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="relative p-6 w-full">
                    <h3 className="text-white text-xl font-bold">{collection.name}</h3>
                    <p className="text-white/80 text-sm mt-1">{collection.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-white/60 text-xs">{collection.products || 0} Products</span>
                      <span className="text-white text-sm group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Explore <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
