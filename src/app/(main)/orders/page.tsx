"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Eye, Package, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

type PaymentStatus = "pending" | "approved" | "rejected" | "expired";
type CustomerOrder = {
  id: string;
  order_number: string;
  payment_reference: string;
  fulfillment_method: "delivery" | "pickup";
  created_at: string;
  total: number;
  status: string;
  payment_status: PaymentStatus;
  order_items?: Array<{ quantity?: number; products?: { name?: string } | null }>;
  payments?: Array<{ payment_image: string; status: PaymentStatus; method?: string }>;
};

function paymentPresentation(status: PaymentStatus, hasProof: boolean) {
  if (status === "approved") return { label: "Payment received", detail: "Your payment has been verified.", icon: CheckCircle2, variant: "default" as const };
  if (status === "rejected") return { label: "Payment not received", detail: "Your proof was not accepted. Please contact the store.", icon: XCircle, variant: "destructive" as const };
  if (status === "expired") return { label: "Payment expired", detail: "This payment can no longer be reviewed.", icon: XCircle, variant: "destructive" as const };
  return hasProof
    ? { label: "Payment submitted", detail: "Your screenshot is waiting for admin review.", icon: Clock3, variant: "secondary" as const }
    : { label: "Payment pending", detail: "Submit your payment screenshot to begin verification.", icon: Clock3, variant: "secondary" as const };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/sign-in?redirect=%2Forders"; return; }
    try {
      const response = await fetch("/api/orders", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load orders");
      setOrders(result.data ?? []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadOrders(), 0);
    const interval = window.setInterval(() => void loadOrders(false), 15000);
    const refresh = () => void loadOrders(false);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [loadOrders]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">My Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Payment and delivery updates refresh automatically.</p>
      </div>
      {loading ? <p className="text-muted-foreground">Loading orders…</p> : error ? <p role="alert" className="text-destructive">{error}</p> : orders.length === 0 ? (
        <Card><CardContent className="p-10 text-center sm:p-12"><Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h3 className="mb-2 font-semibold">No orders yet</h3><Button asChild><Link href="/products">Start Shopping</Link></Button></CardContent></Card>
      ) : <div className="grid gap-4 lg:grid-cols-2">{orders.map((order) => {
        const payment = order.payments?.[0];
        const presentation = paymentPresentation(order.payment_status, Boolean(payment));
        const PaymentIcon = presentation.icon;
        const units = order.order_items?.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) ?? 0;
        return (
          <Card key={order.id} className="overflow-hidden"><CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="font-mono text-sm font-semibold">{order.order_number}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()} · {units} units</p></div>
              <div className="flex flex-wrap gap-2"><Badge variant="outline">{order.fulfillment_method === "pickup" ? "Store pickup" : "Delivery"}</Badge><Badge variant="secondary">{order.status === "shipped" ? "On the way" : order.status}</Badge></div>
            </div>
            <p className="text-xl font-semibold">{formatPrice(Number(order.total))}</p>
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-3"><PaymentIcon className="mt-0.5 h-5 w-5 shrink-0" /><div><Badge variant={presentation.variant}>{presentation.label}</Badge><p className="mt-2 text-sm text-muted-foreground">{presentation.detail}</p></div></div>
              <div className="mt-4 flex flex-col gap-2 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-muted-foreground">Reference</span><strong className="font-mono tracking-widest">{order.payment_reference}</strong></div>
            </div>
            {payment?.payment_image && <Button className="w-full sm:w-auto" variant="outline" size="sm" asChild><a href={payment.payment_image} target="_blank" rel="noreferrer"><Eye className="mr-2 h-4 w-4" />View submitted screenshot</a></Button>}
          </CardContent></Card>
        );
      })}</div>}
    </div>
  );
}
