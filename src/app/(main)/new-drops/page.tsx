"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const newDrops = [
  {
    id: "nd1",
    name: "Monsoon Tee",
    price: 35000,
    sale_price: 25000,
    category: "T-Shirts",
    image: "/images/placeholder.svg",
    drop_date: "July 2026",
  },
  {
    id: "nd2",
    name: "Wild Spirit Hoodie",
    price: 65000,
    category: "Hoodies",
    image: "/images/placeholder.svg",
    drop_date: "July 2026",
  },
  {
    id: "nd3",
    name: "Soul Cap",
    price: 18000,
    sale_price: 15000,
    category: "Accessories",
    image: "/images/placeholder.svg",
    drop_date: "June 2026",
  },
  {
    id: "nd4",
    name: "After Rain Jacket",
    price: 85000,
    category: "Outerwear",
    image: "/images/placeholder.svg",
    drop_date: "June 2026",
  },
  {
    id: "nd5",
    name: "Storm Joggers",
    price: 48000,
    category: "Bottoms",
    image: "/images/placeholder.svg",
    drop_date: "July 2026",
  },
  {
    id: "nd6",
    name: "Rebel Beanie",
    price: 15000,
    category: "Accessories",
    image: "/images/placeholder.svg",
    drop_date: "June 2026",
  },
  {
    id: "nd7",
    name: "Eclipse Tote",
    price: 22000,
    category: "Accessories",
    image: "/images/placeholder.svg",
    drop_date: "July 2026",
  },
  {
    id: "nd8",
    name: "Thunder Socks",
    price: 8000,
    category: "Accessories",
    image: "/images/placeholder.svg",
    drop_date: "June 2026",
  },
];

export default function NewDropsPage() {
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
        {newDrops.map((item, index) => (
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
                    <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {item.sale_price ? (
                        <>
                          <span className="text-sm font-bold text-primary">{formatPrice(item.sale_price)}</span>
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(item.price)}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold">{formatPrice(item.price)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.drop_date}
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
