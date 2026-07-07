"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

const categories = [
  { id: "all", name: "All Products" },
  { id: "1", name: "T-Shirts" },
  { id: "2", name: "Hoodies" },
  { id: "3", name: "Accessories" },
  { id: "4", name: "Outerwear" },
  { id: "5", name: "Bottoms" },
];

const placeholderProducts = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: [
    "Monsoon Tee", "Wild Spirit Hoodie", "Soul Cap", "After Rain Jacket",
    "Urban Cargo Pants", "Midnight Crewneck", "Savage Shorts", "Eclipse Tote",
    "Thunder Socks", "Wilderness Tee", "Storm Joggers", "Rebel Beanie"
  ][i],
  price: [35000, 65000, 18000, 85000, 55000, 45000, 28000, 22000, 8000, 32000, 48000, 15000][i],
  sale_price: [25000, null, 15000, null, null, null, null, null, null, null, null, null][i],
  category: categories[Math.floor(i / 2) + (i % 2 === 0 ? 1 : 0)]?.name || "T-Shirts",
  image: "/images/placeholder.svg",
  is_new: i < 4,
}));

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");

  const filtered = placeholderProducts
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || p.category === categories.find(c => c.id === category)?.name;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return 0;
    });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Products</h1>
        <p className="text-muted-foreground mt-2">Browse our latest collection</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/products/${product.id}`}>
                <Card className="group overflow-hidden h-full">
                  <CardContent className="p-0">
                    <div className="relative aspect-square bg-muted">
                      {product.sale_price && (
                        <Badge className="absolute top-2 left-2 z-10 bg-red-500">SALE</Badge>
                      )}
                      {product.is_new && (
                        <Badge className="absolute top-2 right-2 z-10" variant="secondary">NEW</Badge>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-3 md:p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.category}</p>
                      <h3 className="font-medium mt-1 group-hover:text-primary transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {product.sale_price ? (
                          <>
                            <span className="font-semibold">{formatPrice(product.sale_price)}</span>
                            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>
                          </>
                        ) : (
                          <span className="font-semibold">{formatPrice(product.price)}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
