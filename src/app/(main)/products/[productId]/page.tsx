"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Minus, Plus, ShoppingCart, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

export default function ProductDetailPage() {
  const params = useParams();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  // Placeholder product
  const product = {
    id: params.productId as string,
    name: "Monsoon Tee",
    slug: "monsoon-tee",
    price: 35000,
    sale_price: 25000,
    discount_percent: 29,
    description:
      "Premium quality cotton t-shirt featuring the exclusive Monsoon collection design. Crafted with 100% organic cotton for maximum comfort. Perfect for everyday wear with a unique wild soul aesthetic.\n\n• 100% Organic Cotton\n• Regular fit\n• Screen printed design\n• Pre-shrunk fabric\n• Machine washable",
    category: "T-Shirts",
    stock: 50,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "White", "Olive", "Navy"],
    images: [
      "/images/placeholder.svg",
      "/images/placeholder.svg",
      "/images/placeholder.svg",
      "/images/placeholder.svg",
    ],
  };

  const handleAddToCart = () => {
    if (!selectedSize) return;
    if (!selectedColor) return;
    addItem(
      { ...product, category_id: "", sku: "", is_active: true, is_archived: false, is_featured: false, created_at: "", updated_at: "" } as any,
      quantity,
      selectedSize,
      selectedColor
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/products" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div>
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Product Image
            </div>
            {product.sale_price && (
              <Badge className="absolute top-4 left-4 z-10 bg-red-500 text-lg px-3 py-1">
                -{product.discount_percent}%
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`aspect-square rounded-md overflow-hidden bg-muted border-2 transition-colors ${
                  i === activeImage ? "border-primary" : "border-transparent"
                }`}
              >
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  {i + 1}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
            {product.category}
          </p>
          <motion.h1
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {product.name}
          </motion.h1>

          <div className="flex items-center gap-3 mb-6">
            {product.sale_price ? (
              <>
                <span className="text-3xl font-bold text-red-500">
                  {formatPrice(product.sale_price)}
                </span>
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
                <Badge variant="destructive">Save {formatPrice(product.price - product.sale_price)}</Badge>
              </>
            ) : (
              <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            )}
          </div>

          <Separator className="mb-6" />

          {/* Size Selection */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">
              Size {selectedSize && <span className="text-primary">- {selectedSize}</span>}
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${
                    selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:border-primary hover:text-primary"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">
              Color {selectedColor && <span className="text-primary">- {selectedColor}</span>}
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${
                    selectedColor === color
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:border-primary hover:text-primary"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Quantity</h3>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-medium w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground ml-2">
                {product.stock} in stock
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button
              size="lg"
              className="flex-1 text-base"
              onClick={handleAddToCart}
              disabled={!selectedSize || !selectedColor}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Description */}
          <div>
            <h3 className="font-medium mb-3">Description</h3>
            <div className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
              {product.description}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Link key={i} href={`/products/${i}`}>
              <Card className="group overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-square bg-muted">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground uppercase">Product</p>
                    <h3 className="font-medium mt-1 group-hover:text-primary transition-colors">
                      Product {i}
                    </h3>
                    <span className="font-semibold text-sm">
                      {formatPrice(30000 + i * 5000)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
