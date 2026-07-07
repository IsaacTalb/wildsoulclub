"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function OrderSuccessPage() {
  const orderNumber = "WSC-" + Date.now().toString().slice(-8);

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        className="max-w-lg mx-auto text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for your order. We&apos;ll process it right away.
        </p>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Package className="h-5 w-5" />
              <span>Order Number</span>
            </div>
            <p className="text-2xl font-bold font-mono">{orderNumber}</p>

            <Separator className="my-4" />

            <div className="text-sm text-muted-foreground space-y-2">
              <p>📧 A confirmation email has been sent to your email.</p>
              <p>📱 We&apos;ll notify you when your order status changes.</p>
              <p>⏱ Estimated delivery: 3-5 business days.</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Upload Prompt */}
        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">📸 Don&apos;t Forget: Upload Payment</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you haven&apos;t paid yet, please transfer to the provided account numbers
              and upload your payment screenshot in the order details.
            </p>
            <Link href={`/orders`}>
              <Button variant="outline">
                Upload Payment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/products">
            <Button>
              <ShoppingBag className="mr-2 h-5 w-5" /> Continue Shopping
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline">View Orders</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
