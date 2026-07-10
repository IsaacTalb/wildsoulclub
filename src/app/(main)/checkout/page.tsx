"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { checkoutSchema, type CheckoutFormData } from "@/schemas";

const paymentMethods = [
  { id: "kpay", name: "KBZPay", number: "09-123456789" },
  { id: "wave", name: "Wave", number: "09-987654321" },
  { id: "ayapay", name: "AYA Pay", number: "09-456789123" },
  { id: "cbpay", name: "CB Pay", number: "09-789123456" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("kpay");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deliveryFee = items.length > 0 ? 3000 : 0;
  const subtotal = getSubtotal();
  const total = subtotal >= 100000 ? subtotal : subtotal + deliveryFee;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    // Simulate order creation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    clearCart();
    router.push("/order-success");
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Button>
          <Link href="/products">Shop Now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input id="full_name" {...register("full_name")} placeholder="Enter your full name" />
                    {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="your@email.com" />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" {...register("phone")} placeholder="09-XXX XXX XXX" />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input id="address" {...register("address")} placeholder="Street address, building name" />
                    {errors.address && <p className="text-sm text-destructive mt-1">{errors.address.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="township">Township *</Label>
                    <Input id="township" {...register("township")} placeholder="e.g. Hlaing" />
                    {errors.township && <p className="text-sm text-destructive mt-1">{errors.township.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" {...register("city")} placeholder="e.g. Yangon" />
                    {errors.city && <p className="text-sm text-destructive mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input id="state" {...register("state")} placeholder="e.g. Yangon Region" />
                    {errors.state && <p className="text-sm text-destructive mt-1">{errors.state.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" {...register("zip")} placeholder="Optional" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Order Notes</Label>
                    <Textarea id="notes" {...register("notes")} placeholder="Special instructions (optional)" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Transfer to one of our accounts and upload the payment screenshot
                </p>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 rounded-lg border has-[[data-state=checked]]:border-primary">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="font-medium cursor-pointer">
                          {method.name}
                        </Label>
                      </div>
                      <span className="text-sm text-muted-foreground">{method.number}</span>
                    </div>
                  ))}
                </RadioGroup>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Payment Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Transfer the total amount to the selected account</li>
                        <li>Take a screenshot of the payment confirmation</li>
                        <li>Upload the screenshot on the next page</li>
                        <li>Admin will verify and confirm your order</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 rounded bg-muted shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size} / {item.color} x {item.quantity}
                        </p>
                        <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="mb-4" />

                <div className="space-y-2 text-sm">
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
                      <span>Free Delivery</span>
                      <span>-{formatPrice(deliveryFee)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-6 text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Place Order
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  Secure checkout
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
