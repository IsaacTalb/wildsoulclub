"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock3, Eye, KeyRound, Package, Truck, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";

type PaymentStatus = "pending" | "approved" | "rejected" | "expired";
type CustomerOrder = {
  id: string; order_number: string; payment_reference: string; fulfillment_method: "delivery" | "pickup";
  created_at: string; total: number; status: string; payment_status: PaymentStatus;
  order_items?: Array<{ quantity?: number; products?: { name?: string } | null }>;
  payments?: Array<{ payment_image: string; status: PaymentStatus; method?: string }>;
};
type GuestOrder = {
  order_number: string;
  items: Array<{ quantity: number; size?: string | null; color?: string | null; unit_price: number; products?: { name?: string; thumbnail_url?: string | null } | null }>;
  totals: { subtotal: number; delivery_fee: number; discount_amount: number; total: number };
  fulfillment_status: string; payment_status: PaymentStatus; payment_reference: string;
  courier?: string | null; tracking_number?: string | null; created_at: string; updated_at: string;
};
type GuestCredentials = { identifier: string; capability: string };

function paymentPresentation(status: PaymentStatus, hasProof = true) {
  if (status === "approved") return { label: "Payment received", detail: "Your payment has been verified.", icon: CheckCircle2, variant: "default" as const };
  if (status === "rejected") return { label: "Payment not received", detail: "Your proof was not accepted. Please contact the store.", icon: XCircle, variant: "destructive" as const };
  if (status === "expired") return { label: "Payment expired", detail: "This payment can no longer be reviewed.", icon: XCircle, variant: "destructive" as const };
  return hasProof
    ? { label: "Payment submitted", detail: "Your screenshot is waiting for admin review.", icon: Clock3, variant: "secondary" as const }
    : { label: "Payment pending", detail: "Submit your payment screenshot to begin verification.", icon: Clock3, variant: "secondary" as const };
}

export default function OrdersPage() {
  const [sessionState, setSessionState] = useState<"loading" | "signed-in" | "guest">("loading");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [guestOrder, setGuestOrder] = useState<GuestOrder | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [capability, setCapability] = useState("");
  const guestCredentials = useRef<GuestCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [proofViewer, setProofViewer] = useState<{ src: string; orderNumber: string } | null>(null);

  const loadGuestOrder = useCallback(async (credentials: GuestCredentials, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/orders/guest", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ order_identifier: credentials.identifier, capability: credentials.capability }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to look up this order");
      guestCredentials.current = credentials;
      setGuestOrder(result.data);
      setIdentifier(result.data.order_number);
      setCapability("");
      setError("");
    } catch (err) {
      if (showLoading) setGuestOrder(null);
      setError(err instanceof Error ? err.message : "Unable to look up this order");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setSessionState("guest");
      if (showLoading) setLoading(false);
      return;
    }
    setSessionState("signed-in");
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
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) return void loadOrders();
      setSessionState("guest");
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const fragmentIdentifier = fragment.get("order");
      const fragmentCapability = fragment.get("capability");
      if (fragmentIdentifier && fragmentCapability) {
        setIdentifier(fragmentIdentifier);
        sessionStorage.setItem("wsc-guest-order", JSON.stringify({ identifier: fragmentIdentifier, capability: fragmentCapability }));
        void loadGuestOrder({ identifier: fragmentIdentifier, capability: fragmentCapability });
      } else {
        try {
          const saved = JSON.parse(sessionStorage.getItem("wsc-guest-order") ?? "null") as GuestCredentials | null;
          if (saved?.identifier && saved.capability) {
            setIdentifier(saved.identifier);
            void loadGuestOrder(saved);
          } else setLoading(false);
        } catch {
          sessionStorage.removeItem("wsc-guest-order");
          setLoading(false);
        }
      }
    });
    const interval = window.setInterval(() => {
      if (guestCredentials.current) void loadGuestOrder(guestCredentials.current, false);
      else void loadOrders(false);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loadGuestOrder, loadOrders]);

  const submitGuestLookup = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    void loadGuestOrder({ identifier: identifier.trim(), capability });
  };

  if (sessionState === "guest") {
    const presentation = guestOrder ? paymentPresentation(guestOrder.payment_status) : null;
    const PaymentIcon = presentation?.icon;
    return <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6"><h1 className="text-2xl font-bold sm:text-3xl">Track a guest order</h1><p className="mt-1 text-sm text-muted-foreground">Orders opened from checkout are loaded automatically. You can also use the order number and backup guest access code.</p></div>
      {!guestOrder && <Card><CardContent className="p-5 sm:p-6"><form className="space-y-4" onSubmit={submitGuestLookup}>
        <div className="space-y-2"><Label htmlFor="order-identifier">Order number</Label><Input id="order-identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="WSC-…" autoComplete="off" required /></div>
        <div className="space-y-2"><Label htmlFor="guest-capability">Guest access code</Label><Input id="guest-capability" type="password" value={capability} onChange={(event) => setCapability(event.target.value)} autoComplete="off" required /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}><KeyRound className="mr-2 h-4 w-4" />{loading ? "Looking up…" : "Track order"}</Button>
      </form></CardContent></Card>}
      {guestOrder && presentation && PaymentIcon && <Card className="overflow-hidden"><CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-lg font-bold">{guestOrder.order_number}</p><p className="text-xs text-muted-foreground">Placed {new Date(guestOrder.created_at).toLocaleString()}</p></div><Badge variant="secondary">{guestOrder.fulfillment_status === "shipped" ? "On the way" : guestOrder.fulfillment_status}</Badge></div>
        <div className="space-y-3">{guestOrder.items.map((item, index) => <div key={`${item.products?.name ?? "item"}-${index}`} className="flex items-center gap-3 border-b pb-3 last:border-0">
          {item.products?.thumbnail_url && <Image src={item.products.thumbnail_url} alt="" width={56} height={56} className="h-14 w-14 rounded-md object-cover" />}
          <div className="min-w-0 flex-1"><p className="font-medium">{item.products?.name ?? "Order item"}</p><p className="text-sm text-muted-foreground">Qty {item.quantity}{item.size ? ` · ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""}</p></div><p className="text-sm font-medium">{formatPrice(Number(item.unit_price) * item.quantity)}</p>
        </div>)}</div>
        <div className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(Number(guestOrder.totals.subtotal))}</span></div>{Number(guestOrder.totals.discount_amount) > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatPrice(Number(guestOrder.totals.discount_amount))}</span></div>}<div className="flex justify-between"><span>Delivery</span><span>{formatPrice(Number(guestOrder.totals.delivery_fee))}</span></div><div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{formatPrice(Number(guestOrder.totals.total))}</span></div></div>
        <div className="rounded-xl border p-4"><div className="flex items-start gap-3"><PaymentIcon className="mt-0.5 h-5 w-5" /><div><Badge variant={presentation.variant}>{presentation.label}</Badge><p className="mt-2 text-sm text-muted-foreground">{presentation.detail}</p></div></div><div className="mt-4 flex justify-between border-t pt-3 text-sm"><span className="text-muted-foreground">Payment reference</span><strong className="font-mono">{guestOrder.payment_reference}</strong></div></div>
        {(guestOrder.courier || guestOrder.tracking_number) && <div className="flex gap-3 rounded-xl border p-4"><Truck className="h-5 w-5" /><div><p className="font-medium">{guestOrder.courier || "Courier delivery"}</p>{guestOrder.tracking_number && <p className="mt-1 font-mono text-sm">{guestOrder.tracking_number}</p>}</div></div>}
        <p className="text-xs text-muted-foreground">Last updated {new Date(guestOrder.updated_at).toLocaleString()}</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button variant="outline" onClick={() => { guestCredentials.current = null; setGuestOrder(null); setCapability(""); setError(""); }}>Look up another order</Button>
      </CardContent></Card>}
    </div>;
  }

  return <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
    <div className="mb-6"><h1 className="text-2xl font-bold sm:text-3xl">My Orders</h1><p className="mt-1 text-sm text-muted-foreground">Payment and delivery updates refresh automatically.</p></div>
    {loading || sessionState === "loading" ? <p className="text-muted-foreground">Loading orders…</p> : error ? <p role="alert" className="text-destructive">{error}</p> : orders.length === 0 ? <Card><CardContent className="p-10 text-center sm:p-12"><Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h3 className="mb-2 font-semibold">No orders yet</h3><Button asChild><Link href="/products">Start Shopping</Link></Button></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">{orders.map((order) => {
      const payment = order.payments?.[0]; const presentation = paymentPresentation(order.payment_status, Boolean(payment)); const PaymentIcon = presentation.icon; const units = order.order_items?.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) ?? 0;
      return <Card key={order.id} className="overflow-hidden"><CardContent className="space-y-4 p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-sm font-semibold">{order.order_number}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()} · {units} units</p></div><div className="flex flex-wrap gap-2"><Badge variant="outline">{order.fulfillment_method === "pickup" ? "Store pickup" : "Delivery"}</Badge><Badge variant="secondary">{order.status === "shipped" ? "On the way" : order.status}</Badge></div></div><p className="text-xl font-semibold">{formatPrice(Number(order.total))}</p><div className="rounded-xl bg-muted/50 p-4"><div className="flex items-start gap-3"><PaymentIcon className="mt-0.5 h-5 w-5 shrink-0" /><div><Badge variant={presentation.variant}>{presentation.label}</Badge><p className="mt-2 text-sm text-muted-foreground">{presentation.detail}</p></div></div><div className="mt-4 flex flex-col gap-2 border-t pt-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-muted-foreground">Reference</span><strong className="font-mono tracking-widest">{order.payment_reference}</strong></div></div>{payment?.payment_image && <Button type="button" className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => setProofViewer({ src: payment.payment_image, orderNumber: order.order_number })}><Eye className="mr-2 h-4 w-4" />View submitted screenshot</Button>}</CardContent></Card>;
    })}</div>}
    <Dialog open={Boolean(proofViewer)} onOpenChange={(open) => { if (!open) setProofViewer(null); }}><DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden p-4 sm:max-w-4xl"><DialogHeader><DialogTitle>Payment screenshot · {proofViewer?.orderNumber}</DialogTitle><DialogDescription>Your submitted payment proof.</DialogDescription></DialogHeader>{proofViewer && <div className="relative min-h-[50vh] overflow-auto rounded-lg bg-black/90"><Image src={proofViewer.src} alt={`Payment screenshot for ${proofViewer.orderNumber}`} width={1400} height={1800} unoptimized className="mx-auto h-auto max-h-[75vh] w-auto object-contain" /></div>}</DialogContent></Dialog>
  </div>;
}
