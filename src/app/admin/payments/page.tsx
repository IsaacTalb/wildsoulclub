"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, CheckCircle, XCircle, Eye, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type OrderDetails = {
  order_number: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  township: string;
  city: string;
  state: string;
  zip?: string | null;
  status: string;
  payment_status: string;
  payment_reference: string;
  fulfillment_method: "delivery" | "pickup";
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total: number;
  notes?: string | null;
  courier?: string | null;
  tracking_number?: string | null;
  order_items?: Array<{
    size?: string | null;
    color?: string | null;
    quantity: number;
    price: number;
    products?: { name?: string | null } | null;
  }>;
};

type PaymentRow = {
  id: string;
  order_id: string;
  method: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "expired";
  payment_image: string;
  transaction_id?: string | null;
  admin_notes?: string | null;
  created_at: string;
  orders?: OrderDetails | null;
};

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function getSession() {
  const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
  return session;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  async function loadPayments() {
    setLoading(true);
    setError("");
    try {
      const session = await getSession();
      const response = await fetch("/api/admin/payments", { headers: session ? { Authorization: `Bearer ${session.access_token}` } : {} });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error ?? "Unable to load payments");
      setPayments(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payments");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(paymentId: string, status: "approved" | "rejected") {
    if (updatingPaymentId) return;
    setUpdatingPaymentId(paymentId);
    setError("");
    try {
      const session = await getSession();
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ paymentId, status }),
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error ?? "Unable to update payment");
      setSelectedPayment(null);
      await loadPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update payment");
    } finally {
      setUpdatingPaymentId(null);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadPayments(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const filtered = useMemo(() => payments.filter((payment) => {
    const matchesStatus = filter === "all" || payment.status === filter;
    const term = search.toLowerCase().trim();
    const matchesSearch = !term || payment.id.toLowerCase().includes(term) || payment.orders?.order_number?.toLowerCase().includes(term) || payment.orders?.payment_reference?.toLowerCase().includes(term) || payment.orders?.full_name?.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  }), [filter, payments, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Payments</h1></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="p-4 pb-0 flex gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search payments..." className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={filter || undefined} onValueChange={(value) => setFilter(value || "all")}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left"><th className="pb-3 pt-4 px-4 font-medium">Payment ID</th><th className="pb-3 pt-4 px-4 font-medium">Order</th><th className="pb-3 pt-4 px-4 font-medium">Method</th><th className="pb-3 pt-4 px-4 font-medium">Amount</th><th className="pb-3 pt-4 px-4 font-medium">Date</th><th className="pb-3 pt-4 px-4 font-medium">Status</th><th className="pb-3 pt-4 px-4 font-medium">Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td className="py-8 px-4 text-muted-foreground" colSpan={7}>Loading payments…</td></tr> : filtered.map((payment) => (
                <tr key={payment.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-mono text-xs">{payment.id.slice(0, 8)}</td>
                  <td className="py-3 px-4"><div className="font-mono text-xs">{payment.orders?.order_number ?? payment.order_id}</div><div className="font-mono text-xs font-semibold tracking-wider">Ref: {payment.orders?.payment_reference ?? "—"}</div></td>
                  <td className="py-3 px-4 uppercase">{payment.method}</td>
                  <td className="py-3 px-4 font-medium">{formatPrice(Number(payment.amount))}</td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4"><Badge variant={payment.status === "approved" ? "default" : payment.status === "rejected" ? "destructive" : "secondary"}>{payment.status}</Badge></td>
                  <td className="py-3 px-4"><div className="flex flex-wrap gap-1">{payment.status === "pending" && <><Button size="icon" variant="ghost" className="text-green-600" disabled={Boolean(updatingPaymentId)} aria-label="Approve payment" onClick={() => void updateStatus(payment.id, "approved")}><CheckCircle className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-red-600" disabled={Boolean(updatingPaymentId)} aria-label="Reject payment" onClick={() => void updateStatus(payment.id, "rejected")}><XCircle className="h-4 w-4" /></Button></>}<Button size="sm" variant="outline" onClick={() => setSelectedPayment(payment)}><Eye className="mr-2 h-4 w-4" />View order</Button></div></td>
                </tr>
              ))}
              {!loading && filtered.length === 0 ? <tr><td className="py-8 px-4 text-muted-foreground" colSpan={7}>No payments found.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <OrderDialog payment={selectedPayment} busy={Boolean(updatingPaymentId)} onOpenChange={(open) => { if (!open) setSelectedPayment(null); }} onReview={updateStatus} />
    </div>
  );
}

function OrderDialog({ payment, busy, onOpenChange, onReview }: { payment: PaymentRow | null; busy: boolean; onOpenChange: (open: boolean) => void; onReview: (id: string, status: "approved" | "rejected") => Promise<void> }) {
  const order = payment?.orders;
  const address = order ? [order.address, order.township, order.city, order.state, order.zip].filter(Boolean).join(", ") : "";

  return <Dialog open={Boolean(payment)} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>Order {order?.order_number ?? payment?.order_id}</DialogTitle><DialogDescription>Customer, fulfillment, products, and payment proof for this order.</DialogDescription></DialogHeader>
      {payment && order ? <div className="space-y-5">
        <div className="grid gap-4 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
          <div className="space-y-2 text-sm"><p className="font-semibold">{order.full_name}</p><a className="flex items-center gap-2 break-all" href={`mailto:${order.email}`}><Mail className="h-4 w-4" />{order.email}</a><a className="flex items-center gap-2" href={`tel:${order.phone}`}><Phone className="h-4 w-4" />{order.phone}</a></div>
          <div className="flex gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{order.fulfillment_method === "pickup" ? "Store pickup — customer will collect the order" : address}</span></div>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-muted-foreground">Fulfillment status</p><Badge variant="outline">{order.status}</Badge></div><div><p className="text-muted-foreground">Payment method</p><p className="uppercase">{payment.method}</p></div><div><p className="text-muted-foreground">Payment status</p><Badge variant={payment.status === "approved" ? "default" : payment.status === "rejected" ? "destructive" : "secondary"}>{payment.status}</Badge></div><div><p className="text-muted-foreground">Amount submitted</p><p className="font-semibold">{formatPrice(Number(payment.amount))}</p></div><div><p className="text-muted-foreground">Order total</p><p className="font-semibold">{formatPrice(Number(order.total))}</p><p className="text-xs text-muted-foreground">Subtotal {formatPrice(Number(order.subtotal))} · Delivery {formatPrice(Number(order.delivery_fee))} · Discount {formatPrice(Number(order.discount_amount))}</p></div><div><p className="text-muted-foreground">Payment reference</p><p className="break-all font-mono font-semibold">{order.payment_reference}</p>{payment.transaction_id && <p className="break-all text-xs text-muted-foreground">Transaction: {payment.transaction_id}</p>}</div></div>
        {(order.courier || order.tracking_number) && <p className="text-sm"><span className="font-medium">Delivery details:</span> {[order.courier, order.tracking_number].filter(Boolean).join(" · ")}</p>}
        <div><h3 className="mb-2 font-semibold">Product lines</h3><ul className="divide-y rounded-xl border">{order.order_items?.length ? order.order_items.map((item, index) => <li key={index} className="flex justify-between gap-4 p-3 text-sm"><div><p className="font-medium">{item.products?.name ?? "Unavailable product"}</p><p className="text-muted-foreground">{item.size ? `Size: ${item.size}` : "No size"}{item.color ? ` · Color: ${item.color}` : " · No color"}</p></div><div className="text-right"><p>Quantity: {item.quantity}</p><p className="text-muted-foreground">{formatPrice(Number(item.price))} each</p></div></li>) : <li className="p-3 text-sm text-muted-foreground">No product details available.</li>}</ul></div>
        {order.notes && <p className="rounded-lg border p-3 text-sm"><span className="font-medium">Order notes:</span> {order.notes}</p>}
        {payment.admin_notes && <p className="rounded-lg border p-3 text-sm"><span className="font-medium">Payment review notes:</span> {payment.admin_notes}</p>}
        <div><h3 className="mb-2 font-semibold">Payment proof</h3><a href={payment.payment_image} target="_blank" rel="noreferrer" aria-label={`Open payment proof for order ${order.order_number} in a new tab`} className="block overflow-hidden rounded-xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {/* eslint-disable-next-line @next/next/no-img-element -- payment proofs use runtime external URLs that are not known to the image optimizer */}
          <img src={payment.payment_image} alt={`Payment proof submitted for order ${order.order_number}`} className="max-h-80 w-full object-contain" />
        </a><p className="mt-1 text-xs text-muted-foreground">Select the proof image to open the full-size version.</p></div>
        {payment.status === "pending" && <div className="flex justify-end gap-2 border-t pt-4"><Button variant="destructive" disabled={busy} onClick={() => void onReview(payment.id, "rejected")}><XCircle className="mr-2 h-4 w-4" />{busy ? "Reviewing…" : "Reject"}</Button><Button disabled={busy} onClick={() => void onReview(payment.id, "approved")}><CheckCircle className="mr-2 h-4 w-4" />{busy ? "Reviewing…" : "Approve"}</Button></div>}
      </div> : <p className="text-sm text-muted-foreground">Order details are unavailable.</p>}
    </DialogContent>
  </Dialog>;
}
