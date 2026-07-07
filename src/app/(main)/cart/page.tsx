"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCart();
  const deliveryFee = items.length > 0 ? 3000 : 0;
  const subtotal = getSubtotal();
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-2">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven&apos;t added anything yet. Let&apos;s change that!
          </p>
          <Link href="/products">
            <Button size="lg">
              <ArrowLeft className="mr-2 h-5 w-5" /> Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-md overflow-hidden bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.product_id}`}
                  className="font-medium hover:text-primary transition-colors line-clamp-1"
                >
                  {item.product?.name || "Product"}
                </Link>
                <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                  {item.size && <span>Size: {item.size}</span>}
                  {item.color && <span>Color: {item.color}</span>}
                </div>
                <p className="font-semibold mt-1">{formatPrice(item.price)}</p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span>
                </div>
                {subtotal >= 100000 && (
                  <div className="flex justify-between text-green-600">
                    <span>Free Delivery Discount</span>
                    <span>-{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(subtotal >= 100000 ? subtotal : total)}</span>
                </div>
              </div>

              <div className="mt-4">
                <Input
                  placeholder="Enter coupon code"
                  className="mb-3"
                />
                <Button variant="outline" className="w-full mb-4">
                  Apply Coupon
                </Button>
              </div>

              <Link href="/checkout">
                <Button size="lg" className="w-full text-base">Proceed to Checkout</Button>
              </Link>

              <div className="mt-4 text-center">
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
