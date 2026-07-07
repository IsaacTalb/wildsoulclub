"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Truck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Placeholder product data
const featuredProducts = [
  {
    id: "1",
    name: "Monsoon Tee",
    price: 35000,
    sale_price: 25000,
    image: "/images/placeholder.svg",
    category: "T-Shirts",
    is_new: true,
  },
  {
    id: "2",
    name: "Wild Spirit Hoodie",
    price: 65000,
    image: "/images/placeholder.svg",
    category: "Hoodies",
    is_new: false,
  },
  {
    id: "3",
    name: "Soul Cap",
    price: 18000,
    sale_price: 15000,
    image: "/images/placeholder.svg",
    category: "Accessories",
    is_new: true,
  },
  {
    id: "4",
    name: "After Rain Jacket",
    price: 85000,
    image: "/images/placeholder.svg",
    category: "Outerwear",
    is_new: false,
  },
];

const heroSlides = [
  {
    title: "New Collection Drops",
    subtitle: "Monsoon 2026 - Embrace the wild within",
    cta: "Shop Now",
    bg: "from-zinc-900 to-zinc-800",
  },
  {
    title: "Limited Edition",
    subtitle: "After Rain Collection - Only while stocks last",
    cta: "Explore",
    bg: "from-neutral-900 to-stone-800",
  },
  {
    title: "Streetwear Redefined",
    subtitle: "Premium quality apparel made for the bold",
    cta: "Discover",
    bg: "from-gray-900 to-slate-800",
  },
];

const collections = [
  { name: "After Rain", slug: "after-rain", image: "/images/placeholder.svg" },
  { name: "Monsoon 2026", slug: "monsoon-2026", image: "/images/placeholder.svg" },
  { name: "Summer", slug: "summer", image: "/images/placeholder.svg" },
  { name: "Limited", slug: "limited", image: "/images/placeholder.svg" },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      {/* Hero Slider */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <motion.div
            key={index}
            className={`absolute inset-0 bg-gradient-to-r ${slide.bg} flex items-center`}
            initial={{ opacity: 0 }}
            animate={{
              opacity: index === currentSlide ? 1 : 0,
            }}
            transition={{ duration: 0.7 }}
          >
            <div className="container mx-auto px-4">
              <div className="max-w-2xl">
                <motion.h1
                  className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{
                    y: index === currentSlide ? 0 : 30,
                    opacity: index === currentSlide ? 1 : 0,
                  }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {slide.title}
                </motion.h1>
                <motion.p
                  className="text-lg md:text-xl text-gray-300 mb-8"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{
                    y: index === currentSlide ? 0 : 30,
                    opacity: index === currentSlide ? 1 : 0,
                  }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {slide.subtitle}
                </motion.p>
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{
                    y: index === currentSlide ? 0 : 30,
                    opacity: index === currentSlide ? 1 : 0,
                  }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Link href="/products">
                    <Button size="lg" className="text-base">
                      {slide.cta} <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-y bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: "Free Delivery", desc: "Orders over 100,000 MMK" },
              { icon: Shield, title: "Secure Payment", desc: "100% secure checkout" },
              { icon: Clock, title: "Fast Processing", desc: "24-48hr processing" },
              { icon: Sparkles, title: "Premium Quality", desc: "Top quality materials" },
            ].map((feature) => (
              <div key={feature.title} className="flex items-center gap-3">
                <feature.icon className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Collections</h2>
            <Link href="/collections">
              <Button variant="outline">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {collections.map((collection) => (
              <Link key={collection.slug} href={`/collections/${collection.slug}`}>
                <Card className="group overflow-hidden border-0">
                  <CardContent className="p-0 relative aspect-[3/4] bg-muted">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold text-lg">
                        {collection.name}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
              <p className="text-muted-foreground mt-1">Our latest drops</p>
            </div>
            <Link href="/products">
              <Button variant="outline">
                Shop All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="group overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-square bg-muted">
                      {product.sale_price && (
                        <Badge className="absolute top-2 left-2 z-10 bg-red-500">
                          SALE
                        </Badge>
                      )}
                      {product.is_new && (
                        <Badge className="absolute top-2 right-2 z-10" variant="secondary">
                          NEW
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {product.category}
                      </p>
                      <h3 className="font-medium mt-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {product.sale_price ? (
                          <>
                            <span className="font-semibold">
                              {product.sale_price.toLocaleString()} MMK
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              {product.price.toLocaleString()} MMK
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold">
                            {product.price.toLocaleString()} MMK
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Banner CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 p-8 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join the Wild Soul Family
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Sign up for exclusive drops, early access, and members-only pricing.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/sign-up">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/collections">
                <Button size="lg" variant="outline">Explore</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
