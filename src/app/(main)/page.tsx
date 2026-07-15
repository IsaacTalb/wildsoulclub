"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Truck, Clock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

type HomeProduct = {
  id: string;
  name: string;
  price: number;
  sale_price?: number | null;
  category?: string | null;
  is_new_drop?: boolean | null;
  is_featured?: boolean | null;
  thumbnail_url?: string | null;
  product_images?: { url?: string | null; image_url?: string | null; object_key?: string | null }[] | null;
};

type HomeCollection = {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
};

function getProductImage(product: HomeProduct) {
  return (
    product.thumbnail_url ||
    product.product_images?.[0]?.url ||
    product.product_images?.[0]?.image_url ||
    product.product_images?.[0]?.object_key ||
    ""
  );
}

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<HomeProduct[]>([]);
  const [collections, setCollections] = useState<HomeCollection[]>([]);

  const heroSlides = featuredProducts
    .filter((product) => product.is_new_drop || product.is_featured)
    .slice(0, 3)
    .map((product) => ({
      id: product.id,
      title: product.name,
      subtitle: product.category || "Wild Soul Club",
      image: getProductImage(product),
    }));

  useEffect(() => {
    const fetchHomeData = async () => {
      const [productsResponse, collectionsResponse] = await Promise.all([
        fetch("/api/public/products?sort=newest"),
        fetch("/api/public/collections"),
      ]);

      if (productsResponse.ok) {
        const productsJson = await productsResponse.json();
        const products = (productsJson.data || []) as HomeProduct[];
        setFeaturedProducts(products.filter((product) => product.is_featured).slice(0, 4));
      }

      if (collectionsResponse.ok) {
        const collectionsJson = await collectionsResponse.json();
        setCollections(((collectionsJson.data || []) as HomeCollection[]).slice(0, 4));
      }
    };

    fetchHomeData();
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div>
      <Header/>
      {/* Hero Slider */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {heroSlides.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4">Wild Soul Club</h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">Add featured or new-drop products in Supabase to power this hero.</p>
              <Link href="/products"><Button size="lg">Shop Now</Button></Link>
            </div>
          </div>
        ) : heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${index === currentSlide ? "opacity-100" : "opacity-0"}`}
            style={{
              backgroundImage: slide.image ? `url(${slide.image})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="container mx-auto px-4">
              <div className="max-w-2xl">
                <h1
                  className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4"
                >
                  {slide.title}
                </h1>
                <p
                  className="text-lg md:text-xl text-gray-300 mb-8"
                >
                  {slide.subtitle}
                </p>
                <div
                >
                  <Link href="/new-drops">
                    <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                      Live Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
            {collections.length === 0 ? (
              <Card className="col-span-full border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No active collections found in the database yet.</CardContent></Card>
            ) : collections.map((collection) => (
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
              {featuredProducts.length === 0 ? (
              <Card className="col-span-full border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No featured products found in the database yet.</CardContent></Card>
            ) : featuredProducts.map((product, index) => (
                <Link key={product.id} href={`/products/${product.id}`} className="relative block">
                  {/* Card container */}
                  <div
                    className="group overflow-visible rounded-[24px] bg-[#FAFAFA] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-4"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(255,255,255,0.8), rgba(240,240,240,0.4))',
                      // Editorial vertical offsets
                      transform: `translateY(${[0, -18, 12, -10][index % 4]}px)`,
                    }}
                  >
                    {/* Image container */}
                    <div
                      className="relative w-full h-0 pb-[100%]"
                    >
                      <Image
                        src={getProductImage(product) || "/images/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    {/* Hover arrow icon */}
                    <div
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    >
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
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
