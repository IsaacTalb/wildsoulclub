"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Mail, MapPin, Phone, Search, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "approved" | "rejected" | "expired";

type PaymentRow = {
  id: string;
  status: PaymentStatus;
  payment_image: string;
  method: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  township: string;
  city: string;
  state: string;
  zip?: string | null;
  created_at: string;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_reference: string;
  fulfillment_method: "delivery" | "pickup";
  notes?: string | null;
  payments?: PaymentRow[];
  order_items?: Array<{ quantity?: number; products?: { name?: string } | null }>;
};

const orderStatuses: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function getSession() {
  const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
  return session;
}

function paymentLabel(status: PaymentStatus) {
  if (status === "approved") return "Payment received";
  if (status === "rejected") return "Payment not received";
  if (status === "expired") return "Payment expired";
  return "Awaiting payment review";
}

function paymentVariant(status: PaymentStatus) {
  return status === "approved" ? "default" : status === "rejected" || status === "expired" ? "destructive" : "secondary";
}

function addressLine(order: OrderRow) {
  return [order.address, order.township, order.city, order.state, order.zip].filter(Boolean).join(", ");
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const loadOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const session = await getSession();
      const response = await fetch("/api/admin/orders", {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        cache: "no-store",
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error ?? "Unable to load orders");
      setOrders(result.data ?? []);
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

  async function updateOrderStatus(order: OrderRow, status: OrderStatus) {
    setUpdatingKey(`order:${order.id}`);
    setError("");
    setSuccess("");
    try {
      const session = await getSession();
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ orderId: order.id, status }),
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error ?? "Unable to update fulfillment");
      setSuccess(`${order.order_number} fulfillment updated to ${status}.`);
      await loadOrders(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update fulfillment");
    } finally {
      setUpdatingKey(null);
    }
  }

  async function reviewPayment(order: OrderRow, payment: PaymentRow, status: "approved" | "rejected") {
    setUpdatingKey(`payment:${payment.id}`);
    setError("");
    setSuccess("");
    try {
      const session = await getSession();
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ paymentId: payment.id, status }),
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error ?? "Unable to review payment");
      setSuccess(`${order.order_number}: ${status === "approved" ? "payment received" : "payment not received"}.`);
      await loadOrders(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to review payment");
    } finally {
      setUpdatingKey(null);
    }
  }

  const filtered = useMemo(() => orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const term = search.toLowerCase().trim();
    const matchesSearch = !term || [order.order_number, order.payment_reference, order.full_name, order.email, order.phone]
      .some((value) => value?.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  }), [orders, search, statusFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Orders</h1>
        <p className="text-sm text-muted-foreground">Review payment proof, contact customers, and manage fulfillment.</p>
      </div>

      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">{success}</p>}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search order, reference, customer, email, or phone" className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Fulfillment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All fulfillment</SelectItem>
              {orderStatuses.map((status) => <SelectItem key={status} value={status}>{status === "shipped" ? "On the way" : status}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? <p className="py-12 text-center text-muted-foreground">Loading orders…</p> : filtered.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">No orders found.</CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((order) => {
            const payment = order.payments?.[0];
            const busy = updatingKey?.endsWith(order.id) || (payment && updatingKey === `payment:${payment.id}`);
            const units = order.order_items?.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) ?? 0;
            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="space-y-5 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-mono text-sm font-semibold">{order.order_number}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()} · {units} units</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{order.fulfillment_method === "pickup" ? "Store pickup" : "Delivery"}</Badge>
                      <Badge variant={paymentVariant(order.payment_status)}>{paymentLabel(order.payment_status)}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold">{order.full_name}</p>
                      <a className="flex items-center gap-2 break-all text-muted-foreground hover:text-foreground" href={`tel:${order.phone}`}><Phone className="h-4 w-4 shrink-0" />{order.phone}</a>
                      <a className="flex items-center gap-2 break-all text-muted-foreground hover:text-foreground" href={`mailto:${order.email}`}><Mail className="h-4 w-4 shrink-0" />{order.email}</a>
                    </div>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{order.fulfillment_method === "pickup" ? "Customer will collect from the store" : addressLine(order)}</span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div><p className="text-xs text-muted-foreground">Payment reference</p><p className="font-mono font-semibold tracking-wider">{order.payment_reference}</p></div>
                    <div><p className="text-xs text-muted-foreground">Order total</p><p className="font-semibold">{formatPrice(Number(order.total))}</p></div>
                    <div><p className="text-xs text-muted-foreground">Payment proof</p>{payment ? <p className="uppercase">{payment.method}</p> : <p>No proof submitted</p>}</div>
                  </div>

                  {order.notes && <p className="rounded-lg border px-3 py-2 text-sm"><span className="font-medium">Customer note:</span> {order.notes}</p>}

                  <div className="flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select value={order.status} disabled={Boolean(busy)} onValueChange={(value) => { if (value) void updateOrderStatus(order, value as OrderStatus); }}>
                        <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>{orderStatuses.map((status) => <SelectItem key={status} value={status}>{status === "shipped" ? "On the way" : status}</SelectItem>)}</SelectContent>
                      </Select>
                      {payment?.payment_image ? <Button variant="outline" asChild><a href={payment.payment_image} target="_blank" rel="noreferrer"><Eye className="mr-2 h-4 w-4" />View proof</a></Button> : null}
                    </div>

                    {payment?.status === "pending" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button disabled={Boolean(busy)} onClick={() => void reviewPayment(order, payment, "approved")}><CheckCircle2 className="mr-2 h-4 w-4" />Received</Button>
                        <Button variant="destructive" disabled={Boolean(busy) || order.status === "shipped" || order.status === "delivered"} onClick={() => void reviewPayment(order, payment, "rejected")} title={order.status === "shipped" || order.status === "delivered" ? "A dispatched order cannot be rejected" : undefined}><XCircle className="mr-2 h-4 w-4" />Not received</Button>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
