"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function OrderSuccessPage() {
  const [details, setDetails] = useState({ orderNumber: "Your order", reference: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const timeout = window.setTimeout(() => setDetails({ orderNumber: params.get("order") || "Your order", reference: params.get("reference") || "" }), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <CheckCircle className="mx-auto mb-6 h-16 w-16 text-green-500" />
        <h1 className="mb-2 text-3xl font-bold">Order placed successfully!</h1>
        <p className="mb-8 text-muted-foreground">Your payment is waiting for admin verification.</p>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Package className="h-5 w-5" /><span>Order Number</span>
            </div>
            <p className="font-mono text-2xl font-bold">{details.orderNumber}</p>
            {details.reference && <p className="mt-2 text-sm">Payment reference: <strong className="font-mono tracking-wider">{details.reference}</strong></p>}
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">Your screenshot and payment reference were saved with this order.</p>
          </CardContent>
        </Card>

        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="mb-2 font-semibold">Track your order</h3>
            <p className="mb-4 text-sm text-muted-foreground">View payment verification, pickup or delivery status, and tracking details from My Orders.</p>
            <Button variant="outline" asChild><Link href="/orders">Track Order <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild><Link href="/products"><ShoppingBag className="mr-2 h-5 w-5" /> Continue Shopping</Link></Button>
          <Button variant="outline" asChild><Link href="/orders">View Orders</Link></Button>
        </div>
      </div>
    </div>
  );
}
