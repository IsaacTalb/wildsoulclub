"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, ShieldCheck, Info, Store, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { checkoutSchema, type CheckoutFormData } from "@/schemas";

const paymentMethodDefinitions = [
  { id: "kpay", name: "KBZPay", settingKey: "kpay_number" },
  { id: "wave", name: "Wave", settingKey: "wave_number" },
  { id: "ayapay", name: "AYA Pay", settingKey: "ayapay_number" },
  { id: "cbpay", name: "CB Pay", settingKey: "cbpay_number" },
] as const;

type CheckoutApiResponse = {
  data?: {
    id?: string;
    uploadUrl?: string;
    objectKey?: string;
    imageUrl?: string;
    order_number?: string;
    payment_reference?: string;
  };
  error?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, hasHydrated, getSubtotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("kpay");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"delivery" | "pickup">("delivery");
  const [createdOrder, setCreatedOrder] = useState<{ id: string; order_number?: string; payment_reference: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [storefrontSettings, setStorefrontSettings] = useState<Record<string, string>>({});

  const getValidSession = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return null;
    if (!session) return null;
    const { error: userError } = await supabase.auth.getUser();
    if (!userError) return session;
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) return null;
    return refreshedSession;
  };

  useEffect(() => {
    getValidSession().then((session) => {
      if (!session) router.replace("/sign-in?redirect=%2Fcheckout");
      else setCheckingAuth(false);
    });
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/storefront-settings", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load payment details");
        return response.json();
      })
      .then((result: { data?: Record<string, string> }) =>
        setStorefrontSettings(result.data ?? {}),
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSubmitError("Payment account details are temporarily unavailable. Please refresh before paying.");
      });
    return () => controller.abort();
  }, []);

  const paymentMethods = useMemo(
    () =>
      paymentMethodDefinitions.flatMap((method) => {
        const number = storefrontSettings[method.settingKey]?.trim();
        return number ? [{ ...method, number }] : [];
      }),
    [storefrontSettings],
  );

  const deliveryFee = fulfillmentMethod === "delivery" && items.length > 0 ? 3000 : 0;
  const subtotal = getSubtotal();
  const total = fulfillmentMethod === "pickup" || subtotal >= 100000 ? subtotal : subtotal + deliveryFee;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { fulfillment_method: "delivery" },
  });

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const session = await getValidSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  const readJson = async (response: Response, fallback: string) => {
    const body = await response.text();
    try {
      return JSON.parse(body) as CheckoutApiResponse;
    } catch {
      throw new Error(response.redirected
        ? "Your session expired. Please sign in again before placing your order."
        : `${fallback} The server returned an invalid response.`);
    }
  };

  const readErrorMessage = async (response: Response, fallback: string) => {
    try {
      const result = await readJson(response, fallback);
      return typeof result.error === "string" ? result.error : fallback;
    } catch (error) {
      return error instanceof Error ? error.message : fallback;
    }
  };

  const uploadPaymentProof = async (file: File, headers: Record<string, string>) => {
    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ folder: "payments", contentType: file.type, fileName: file.name }),
    });

    if (!uploadResponse.ok) {
      throw new Error(await readErrorMessage(uploadResponse, "Payment proof upload could not be started. Please try again."));
    }

    const uploadResult = await readJson(uploadResponse, "Payment proof upload could not be started.");
    const { uploadUrl, objectKey, imageUrl } = uploadResult.data ?? {};

    if (!uploadUrl || !objectKey || !imageUrl) {
      throw new Error("Payment proof upload could not be prepared. Please try again.");
    }

    const putResponse = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!putResponse.ok) {
      throw new Error("Payment proof upload failed. Please check your image and try again.");
    }

    return { objectKey, imageUrl };
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setSubmitError(null);

    if (items.length === 0) {
      setSubmitError("Validation error: your cart is empty. Please add items before checkout.");
      return;
    }

    if (!paymentMethods.some((method) => method.id === paymentMethod)) {
      setSubmitError("Validation error: no valid payment account is selected. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const authHeaders = await getAuthHeaders();
      if (!("Authorization" in authHeaders)) {
        throw new Error("Please sign in before placing your order.");
      }
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id ?? null,
            quantity: item.quantity,
            size: item.size || null,
            color: item.color || null,
          })),
          full_name: data.full_name,
          fulfillment_method: fulfillmentMethod,
          email: data.email,
          phone: data.phone,
          address: data.address,
          township: data.township,
          city: data.city,
          state: data.state,
          zip: data.zip,
          notes: data.notes,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error(`Order creation failed: ${await readErrorMessage(orderResponse, "Unable to create your order. Please try again.")}`);
      }

      const orderResult = await readJson(orderResponse, "Order creation failed.");
      const order = orderResult.data;
      if (!order?.id) {
        throw new Error("Order creation failed: the server did not return an order ID.");
      }

      if (!order.payment_reference) throw new Error("Order creation failed: no payment reference was returned.");
      setCreatedOrder({ id: order.id, order_number: order.order_number, payment_reference: order.payment_reference });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Validation error: checkout could not be completed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completePayment = async () => {
    setSubmitError(null);
    if (!createdOrder || !paymentProof) {
      setSubmitError("Please upload your payment screenshot before completing checkout.");
      return;
    }
    setIsSubmitting(true);
    try {
      const authHeaders = await getAuthHeaders();
      if (!("Authorization" in authHeaders)) throw new Error("Your session expired. Please sign in again.");
      if (!paymentProof.type.startsWith("image/") || paymentProof.size > 10 * 1024 * 1024) {
        throw new Error("Payment proof must be an image smaller than 10 MB.");
      }
      const uploadedProof = await uploadPaymentProof(paymentProof, authHeaders);

      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          order_id: createdOrder.id,
          method: paymentMethod,
          transaction_id: createdOrder.payment_reference,
          payment_image: uploadedProof.imageUrl,
          payment_object_key: uploadedProof.objectKey,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error(`Payment creation failed: ${await readErrorMessage(paymentResponse, "Unable to save your payment proof. Please contact support.")}`);
      }

      clearCart();
      router.push(`/order-success?order=${encodeURIComponent(createdOrder.order_number ?? "")}&reference=${createdOrder.payment_reference}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Validation error: checkout could not be completed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasHydrated || checkingAuth) {
    return <div className="container mx-auto min-h-[50vh] px-4 py-16 text-center text-muted-foreground" role="status">Loading checkout…</div>;
  }

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
                <h2 className="text-lg font-semibold mb-4">Fulfillment &amp; Contact</h2>
                <input type="hidden" {...register("fulfillment_method")} />
                <RadioGroup
                  value={fulfillmentMethod}
                  disabled={Boolean(createdOrder)}
                  onValueChange={(value) => {
                    const method = value as "delivery" | "pickup";
                    setFulfillmentMethod(method);
                    setValue("fulfillment_method", method, { shouldValidate: true });
                  }}
                  className="mb-5 grid gap-3 sm:grid-cols-2"
                >
                  <Label htmlFor="delivery" className="flex cursor-pointer items-center gap-3 rounded-lg border p-4">
                    <RadioGroupItem id="delivery" value="delivery" /><Truck className="h-5 w-5" /> Delivery
                  </Label>
                  <Label htmlFor="pickup" className="flex cursor-pointer items-center gap-3 rounded-lg border p-4">
                    <RadioGroupItem id="pickup" value="pickup" /><Store className="h-5 w-5" /> Store pickup
                  </Label>
                </RadioGroup>
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
                  {fulfillmentMethod === "delivery" && <>
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
                  </>}
                  {fulfillmentMethod === "pickup" && (
                    <div className="md:col-span-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                      No delivery fee or address is required. We will contact you when the order is ready to collect.
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Order Notes</Label>
                    <Textarea id="notes" {...register("notes")} placeholder="Special instructions (optional)" />
                  </div>
                  <div className="md:col-span-2 rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-950">
                    <p className="text-sm font-bold">KPay payment-note code</p>
                    {createdOrder ? (
                      <p className="mt-2 font-mono text-3xl font-black tracking-[0.2em] text-red-600">{createdOrder.payment_reference}</p>
                    ) : (
                      <p className="mt-1 text-sm">Your unique 6-character code will appear here after you click <strong>Continue to Payment</strong>.</p>
                    )}
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
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} disabled={Boolean(createdOrder)} className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 rounded-lg border has-[[data-state=checked]]:border-primary">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <Label htmlFor={method.id} className="font-medium cursor-pointer">
                          {method.name} (Min Khant Kyaw)
                        </Label>
                      </div>
                      <span className="text-sm text-muted-foreground">{method.number}</span>
                    </div>
                  ))}
                  {paymentMethods.length === 0 && (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      Loading payment account details…
                    </p>
                  )}
                </RadioGroup>

                {createdOrder && (
                  <div className="mt-6 rounded-lg border-2 border-red-500 bg-red-50 p-5 text-center text-red-950">
                    <p className="text-sm font-bold">Important: use this exact code in your KPay note</p>
                    <p className="mt-2 font-mono text-3xl font-black tracking-[0.2em] text-red-600">{createdOrder.payment_reference}</p>
                    <p className="mt-2 text-xs">The same code is saved with your order for payment matching.</p>
                  </div>
                )}

                <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 shrink-0 text-red-600" />
                    <div className="text-sm text-red-950">
                      <p className="mb-2 font-bold">Easy payment steps</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>{createdOrder ? `Enter ${createdOrder.payment_reference} in the payment note` : "Continue to generate your payment reference"}</li>
                        <li>Transfer the total amount to the selected account</li>
                        <li>Take a screenshot of the payment confirmation</li>
                        <li>Upload the screenshot below</li>
                        <li>Admin will verify and confirm your order</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {createdOrder && <div className="mt-6 space-y-2">
                  <Label htmlFor="payment_proof">Payment Proof Screenshot *</Label>
                  <Input
                    id="payment_proof"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setPaymentProof(event.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a clear JPG, PNG, or other image up to 10 MB.
                  </p>
                </div>}
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
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        {item.product?.thumbnail_url ? (
                          <Image
                            src={item.product.thumbnail_url}
                            alt={item.product.name || "Product"}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">No image</div>
                        )}
                      </div>
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
                    <span className="text-muted-foreground">{fulfillmentMethod === "pickup" ? "Pickup" : "Delivery Fee"}</span>
                    <span>{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span>
                  </div>
                  {fulfillmentMethod === "delivery" && subtotal >= 100000 && (
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
                  type={createdOrder ? "button" : "submit"}
                  onClick={createdOrder ? completePayment : undefined}
                  size="lg"
                  className="w-full mt-6 text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      {createdOrder ? "Submit Payment Proof" : "Continue to Payment"}
                    </>
                  )}
                </Button>

                {submitError && (
                  <p className="mt-4 text-sm text-destructive" role="alert">
                    {submitError}
                  </p>
                )}

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
