"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";

export default function CartPage() {
  const { items, hasHydrated, removeItem, updateQuantity, getSubtotal } = useCart();
  const [deliveryNotice, setDeliveryNotice] = useState(
    "Delivery timing is confirmed after your order is placed.",
  );
  const subtotal = getSubtotal();
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const total = Math.max(0, subtotal - couponDiscount);

  function resetCoupon() {
    setCouponDiscount(0);
    setCouponMessage("");
    sessionStorage.removeItem("wsc-checkout-coupon");
  }

  async function applyCoupon() {
    setCouponMessage("");
    if (!couponCode.trim()) { setCouponDiscount(0); setCouponMessage("Enter a coupon code first."); return; }
    setApplyingCoupon(true);
    try {
      const response = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: couponCode, subtotal }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to apply coupon.");
      const code = String(result.data.code);
      const discount = Number(result.data.discount);
      setCouponCode(code);
      setCouponDiscount(discount);
      setCouponMessage(`${code} applied. It will be verified again at checkout.`);
      sessionStorage.setItem("wsc-checkout-coupon", code);
    } catch (error) {
      setCouponDiscount(0);
      sessionStorage.removeItem("wsc-checkout-coupon");
      setCouponMessage(error instanceof Error ? error.message : "Unable to apply coupon.");
    } finally { setApplyingCoupon(false); }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/storefront-settings", { signal: controller.signal })
      .then((response) => response.json())
      .then((result: { data?: Record<string, string> }) => {
        if (result.data?.delivery_notice) {
          setDeliveryNotice(result.data.delivery_notice);
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (!hasHydrated) {
    return <div className="container mx-auto min-h-[50vh] px-4 py-16 text-center text-muted-foreground" role="status">Loading your cart…</div>;
  }

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
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted md:h-28 md:w-28">
                {item.product?.thumbnail_url ? (
                  <Image
                    src={item.product.thumbnail_url}
                    alt={item.product.name || "Product"}
                    fill
                    sizes="(min-width: 768px) 112px, 96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                )}
              </div>
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
                      onClick={() => { resetCoupon(); updateQuantity(item.id, item.quantity - 1); }}
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
                      onClick={() => { resetCoupon(); updateQuantity(item.id, item.quantity + 1); }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => { resetCoupon(); removeItem(item.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
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
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {couponDiscount > 0 && <div className="flex justify-between text-green-700"><span>Coupon discount</span><span>-{formatPrice(couponDiscount)}</span></div>}
              </div>

              <div className="mt-4">
                <Input
                  placeholder="Enter coupon code"
                  className="mb-3"
                  value={couponCode}
                  onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setCouponDiscount(0); setCouponMessage(""); }}
                />
                <Button type="button" variant="outline" className="w-full mb-2" disabled={applyingCoupon} onClick={() => void applyCoupon()}>
                  {applyingCoupon ? "Checking…" : "Apply Coupon"}
                </Button>
                {couponMessage && <p className={`mb-4 text-xs ${couponDiscount > 0 ? "text-green-700" : "text-destructive"}`}>{couponMessage}</p>}
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-black/5 bg-muted/45 p-3 text-sm">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Delivery charge paid on arrival</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">The cart total covers products only. Pay any delivery charge separately to the delivery person when the order arrives.</p>
                  <span className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{deliveryNotice}</span>
                  <a href="/delivery" className="text-xs px-1 underline">Read More</a>.
                </div>
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
