"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Minus, Plus, ShoppingCart, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/lib/supabase";

export default function ProductDetailPage() {
  const params = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [params.productId]);

  async function fetchProduct() {
    try {
      setLoading(true);
      setError("");

      // Fetch product data
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", params.productId)
        .single();

      if (productError) throw productError;

      // Fetch product images
      const { data: imagesData, error: imagesError } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", params.productId)
        .order("sort_order");

      if (imagesError) throw imagesError;

      // Combine product data with images
      const productWithImages = {
        ...productData,
        images: imagesData.map(img => img.image_url),
        sizes: productData.sizes || [],
        colors: productData.colors || [],
      };

      setProduct(productWithImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  const handleAddToCart = () => {
    if (!selectedSize) return;
    if (!selectedColor) return;
    if (!product) return;

    addItem(
      {
        ...product,
        category_id: product.category_id || "",
        sku: product.sku || "",
        is_active: true,
        is_archived: false,
        is_featured: false,
        created_at: "",
        updated_at: "",
      },
      quantity,
      selectedSize,
      selectedColor
    );
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (error) return <div className="container mx-auto px-4 py-8">Error: {error}</div>;
  if (!product) return <div className="container mx-auto px-4 py-8">Product not found</div>;

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
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            {product.sale_price && (
              <Badge className="absolute top-4 left-4 z-10 bg-red-500 text-lg px-3 py-1">
                -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
              </Badge>
            )}
          </div>
          {product.images && product.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-md overflow-hidden bg-muted border-2 transition-colors ${i === activeImage ? "border-primary" : "border-transparent"}`}
                >
                  <img 
                    src={img}
                    alt={`Product thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
            {product.category || "Uncategorized"}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            {product.sale_price ? (
              <>
                <span className="text-3xl font-bold text-red-500">
                  {formatPrice(product.sale_price)}
                </span>
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            )}
          </div>

          <Separator className="mb-6" />

          <div className="mb-6">
            <p className="font-medium mb-3">Description</p>
            <div className="prose max-w-none">
              {product.description}
            </div>
          </div>

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3">
                Size {selectedSize && <span className="text-primary">- {selectedSize}</span>}
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${selectedSize === size ? "border-primary bg-primary text-primary-foreground" : "border-input hover:border-primary hover:text-primary"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3">
                Color {selectedColor && <span className="text-primary">- {selectedColor}</span>}
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-md border text-sm font-medium transition-all ${selectedColor === color ? "border-primary bg-primary text-primary-foreground" : "border-input hover:border-primary hover:text-primary"}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              {product.stock && (
                <span className="text-sm text-muted-foreground ml-2">
                  {product.stock} in stock
                </span>
              )}
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
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
            <Button variant="outline" size="lg">
              <Heart className="mr-2 h-5 w-5" /> Wishlist
            </Button>
          </div>

          <Button variant="outline" className="w-full">
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>
      </div>
    </div>
  );
}