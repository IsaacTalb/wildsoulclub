"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Truck, Clock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

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

// Create hero slides from the 3 newest products
const heroSlides = featuredProducts
  .filter(product => product.is_new)
  .slice(0, 3)
  .map(product => ({
    id: product.id,
    title: product.name,
    subtitle: product.category,
    cta: "Live Now",
    image: product.image,
    price: product.sale_price || product.price,
  }));

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
      <Header/>
      {/* Hero Slider */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <motion.div
            key={index}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
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
                  <Link href="/new-drops">
                    <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                      Live Now
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
              {featuredProducts.map((product, index) => (
                <Link key={product.id} href={`/products/${product.id}`} className="relative block">
                  {/* Card container */}
                  <motion.div
                    className="group overflow-visible rounded-[24px] bg-[#FAFAFA] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8, rotateX: 2, boxShadow: '0 30px 80px rgba(0,0,0,0.12)' }}
                    transition={{ type: 'spring', duration: 0.6 }}
                    style={{
                      background: 'radial-gradient(circle at center, rgba(255,255,255,0.8), rgba(240,240,240,0.4))',
                      // Editorial vertical offsets
                      transform: `translateY(${[0, -18, 12, -10][index % 4]}px)`,
                    }}
                  >
                    {/* Image container */}
                    <motion.div
                      className="relative w-full h-0 pb-[100%]"
                      whileHover={{ scale: 0.96, y: -6 }}
                      transition={{ type: 'spring', duration: 0.6 }}
                    >
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    </motion.div>
                    {/* Hover arrow icon */}
                    <motion.div
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    >
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  </motion.div>
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
              Join the Wild Soul Club
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
      <Footer />
    </div>
  );
}
