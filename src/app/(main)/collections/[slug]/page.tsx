"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Heart, Share2, Minus, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";

const colors = ["Black", "White", "Navy", "Gray"];
const sizes = ["S", "M", "L", "XL", "2XL"];

export default function CollectionDetailPage({ params }: { params: { slug: string } }) {
  const [selectedColor, setSelectedColor] = useState("Black");
  const [selectedSize, setSelectedSize] = useState("M");
  const [qty, setQty] = useState(1);

  const products = [
    { id: "p1", name: "After Rain Tee", price: 35000, image: null, badge: "New" },
    { id: "p2", name: "After Rain Hoodie", price: 65000, image: null, badge: null },
    { id: "p3", name: "After Rain Cap", price: 18000, image: null, badge: "Sale" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/collections" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Collections
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold capitalize">{params.slug.replace(/-/g, " ")}</h1>
        <p className="text-muted-foreground mt-2">Explore products in this collection</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <div className="aspect-square bg-muted rounded-lg mb-3 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="h-12 w-12" />
                </div>
                {product.badge && (
                  <Badge className="absolute top-3 left-3">
                    {product.badge}
                  </Badge>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
              </div>
              <h3 className="font-medium group-hover:text-primary transition-colors">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
