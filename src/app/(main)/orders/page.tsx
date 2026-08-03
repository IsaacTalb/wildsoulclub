"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

type CustomerOrder = {
  id: string; order_number: string; payment_reference: string; fulfillment_method: "delivery" | "pickup";
  created_at: string; total: number; status: string; payment_status: string;
  courier?: string | null; tracking_number?: string | null; order_items?: unknown[];
  payments?: Array<{ payment_image: string; status: string }>;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = "/sign-in?redirect=%2Forders"; return; }
      const response = await fetch("/api/orders", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "Unable to load orders");
      else setOrders(result.data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>
      {loading ? <p className="text-muted-foreground">Loading orders…</p> : error ? <p role="alert" className="text-destructive">{error}</p> : orders.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h3 className="mb-2 font-semibold">No orders yet</h3><Button asChild><Link href="/products">Start Shopping</Link></Button></CardContent></Card>
      ) : <div className="space-y-4">{orders.map((order) => (
        <Card key={order.id}><CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="font-mono text-sm font-semibold">{order.order_number}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()} · {order.order_items?.length ?? 0} items · {order.fulfillment_method === "pickup" ? "Store pickup" : "Delivery"}</p><p className="mt-2 font-medium">{formatPrice(Number(order.total))}</p></div>
            <div className="flex gap-2"><Badge variant="secondary">{order.status}</Badge><Badge variant={order.payment_status === "approved" ? "default" : "secondary"}>{order.payment_status}</Badge></div>
          </div>
          <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm"><span className="text-muted-foreground">Payment reference</span><strong className="ml-3 font-mono tracking-widest">{order.payment_reference}</strong></div>
          {order.status === "shipped" && <p className="mt-3 text-sm">{order.courier}: <span className="font-mono">{order.tracking_number}</span></p>}
          {order.payments?.[0]?.payment_image && <Button className="mt-3" variant="outline" size="sm" asChild><a href={order.payments[0].payment_image} target="_blank" rel="noreferrer"><Eye className="mr-2 h-4 w-4" /> View payment screenshot</a></Button>}
        </CardContent></Card>
      ))}</div>}
    </div>
  );
}
