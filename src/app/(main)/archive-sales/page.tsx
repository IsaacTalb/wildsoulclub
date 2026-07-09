"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Tag, ArrowRight, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const archiveSales = [
  {
    id: "as1",
    name: "Monsoon Tee",
    price: 35000,
    sale_price: 25000,
    discount: 29,
    category: "T-Shirts",
    image: "/images/placeholder.svg",
  },
  {
    id: "as2",
    name: "Soul Cap",
    price: 18000,
    sale_price: 15000,
    discount: 17,
    category: "Accessories",
    image: "/images/placeholder.svg",
  },
  {
    id: "as3",
    name: "Wilderness Tee",
    price: 32000,
    sale_price: 22000,
    discount: 31,
    category: "T-Shirts",
    image: "/images/placeholder.svg",
  },
  {
    id: "as4",
    name: "Urban Cargo Pants",
    price: 55000,
    sale_price: 40000,
    discount: 27,
    category: "Bottoms",
    image: "/images/placeholder.svg",
  },
  {
    id: "as5",
    name: "Savage Shorts",
    price: 28000,
    sale_price: 19000,
    discount: 32,
    category: "Bottoms",
    image: "/images/placeholder.svg",
  },
  {
    id: "as6",
    name: "Midnight Crewneck",
    price: 45000,
    sale_price: 35000,
    discount: 22,
    category: "Hoodies",
    image: "/images/placeholder.svg",
  },
  {
    id: "as7",
    name: "Thunder Socks (Pack)",
    price: 12000,
    sale_price: 8000,
    discount: 33,
    category: "Accessories",
    image: "/images/placeholder.svg",
  },
  {
    id: "as8",
    name: "Eclipse Tote",
    price: 22000,
    sale_price: 16000,
    discount: 27,
    category: "Accessories",
    image: "/images/placeholder.svg",
  },
];

export default function ArchiveSalesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4">
          <Percent className="h-4 w-4" />
          Limited time offers
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Archive Sale</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Past season favourites at discounted prices — once they&apos;re gone, they&apos;re gone.
        </p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {archiveSales.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/products/${item.id}`}>
              <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted relative flex items-center justify-center">
                    <span className="text-muted-foreground/40 text-sm">Product Image</span>
                    <Badge variant="destructive" className="absolute top-3 left-3">
                      -{item.discount}%
                    </Badge>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-destructive">{formatPrice(item.sale_price)}</span>
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(item.price)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      Save {formatPrice(item.price - item.sale_price)}
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
        <h2 className="text-2xl font-bold mb-2">Don&apos;t miss out!</h2>
        <p className="text-muted-foreground mb-6">These archive deals won&apos;t last forever. Grab them while you can.</p>
        <Link href="/collections">
          <Button variant="outline" size="lg">
            View All Collections <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
