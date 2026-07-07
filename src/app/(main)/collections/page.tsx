"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const collections = [
  { name: "After Rain", slug: "after-rain", desc: "Fresh vibes for the new season", products: 8, color: "bg-blue-900" },
  { name: "Monsoon 2026", slug: "monsoon-2026", desc: "Our biggest collection yet", products: 12, color: "bg-slate-800" },
  { name: "Summer", slug: "summer", desc: "Light and breezy summer fits", products: 6, color: "bg-amber-800" },
  { name: "Limited Edition", slug: "limited", desc: "Exclusive pieces, limited run", products: 4, color: "bg-red-900" },
  { name: "New Arrival", slug: "new-arrival", desc: "Fresh drops every month", products: 10, color: "bg-green-800" },
  { name: "Classics", slug: "classics", desc: "Timeless designs that never fade", products: 15, color: "bg-stone-800" },
];

export default function CollectionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Collections</h1>
        <p className="text-muted-foreground mt-2">Explore our curated collections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection, index) => (
          <motion.div
            key={collection.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/collections/${collection.slug}`}>
              <Card className="group overflow-hidden border-0">
                <CardContent className={`p-0 relative h-64 ${collection.color} flex items-end`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="relative p-6 w-full">
                    <h3 className="text-white text-xl font-bold">{collection.name}</h3>
                    <p className="text-white/80 text-sm mt-1">{collection.desc}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-white/60 text-xs">{collection.products} Products</span>
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
