"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";

type OrderRow = {
  id: string;
  order_number: string;
  full_name: string;
  created_at: string;
  total: number;
  status: OrderStatus;
  payment_status: "pending" | "approved" | "rejected" | "expired";
  courier?: string | null;
  tracking_number?: string | null;
  order_items?: unknown[];
};

type ShippingDraft = {
  courier: string;
  trackingNumber: string;
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

function getOrderMessage(orderNumber: string, status: OrderStatus) {
  return `Order ${orderNumber} fulfillment status updated to ${status}.`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [shippingDrafts, setShippingDrafts] = useState<Record<string, ShippingDraft>>({});

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const session = await getSession();
      const response = await fetch("/api/admin/orders", { headers: session ? { Authorization: `Bearer ${session.access_token}` } : {} });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error ?? "Unable to load orders");
      setOrders(result.data ?? []);
      setShippingDrafts(Object.fromEntries((result.data ?? []).map((order: OrderRow) => [order.id, {
        courier: order.courier ?? "",
        trackingNumber: order.tracking_number ?? "",
      }])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(order: OrderRow, status: OrderStatus) {
    setUpdatingOrderId(order.id);
    setError("");
    setSuccess("");

    const draft = shippingDrafts[order.id] ?? { courier: order.courier ?? "", trackingNumber: order.tracking_number ?? "" };

    try {
      const session = await getSession();
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({
          orderId: order.id,
          status,
          ...(status === "shipped" ? { courier: draft.courier, tracking_number: draft.trackingNumber } : {}),
        }),
      });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error ?? "Unable to update order");
      setSuccess(getOrderMessage(order.order_number, status));
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function setShippingDraft(order: OrderRow, values: Partial<ShippingDraft>) {
    setShippingDrafts((current) => ({
      ...current,
      [order.id]: {
        courier: current[order.id]?.courier ?? order.courier ?? "",
        trackingNumber: current[order.id]?.trackingNumber ?? order.tracking_number ?? "",
        ...values,
      },
    }));
  }

  useEffect(() => { loadOrders(); }, []);

  const filtered = useMemo(() => orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const term = search.toLowerCase().trim();
    const matchesSearch = !term || order.order_number.toLowerCase().includes(term) || order.full_name.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  }), [orders, search, statusFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>
      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700">{success}</p>}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="p-4 pb-0 flex flex-wrap gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search order number or customer..." className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={statusFilter || undefined} onValueChange={(value) => setStatusFilter(value || "all")}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {orderStatuses.map((status) => <SelectItem key={status} value={status}>{status === "shipped" ? "On the way" : status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pt-4 px-4 font-medium">Order ID</th>
                <th className="pb-3 pt-4 px-4 font-medium">Customer</th>
                <th className="pb-3 pt-4 px-4 font-medium">Date</th>
                <th className="pb-3 pt-4 px-4 font-medium">Items</th>
                <th className="pb-3 pt-4 px-4 font-medium">Total</th>
                <th className="pb-3 pt-4 px-4 font-medium">Payment</th>
                <th className="pb-3 pt-4 px-4 font-medium">Fulfillment</th>
                <th className="pb-3 pt-4 px-4 font-medium">Shipping</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td className="py-8 px-4 text-muted-foreground" colSpan={9}>Loading orders…</td></tr> : filtered.map((order) => {
                const draft = shippingDrafts[order.id] ?? { courier: order.courier ?? "", trackingNumber: order.tracking_number ?? "" };
                const isUpdating = updatingOrderId === order.id;

                return (
                  <tr key={order.id} className="border-b last:border-0 align-top">
                    <td className="py-3 px-4 font-mono text-xs">{order.order_number}</td>
                    <td className="py-3 px-4">{order.full_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{order.order_items?.length ?? 0}</td>
                    <td className="py-3 px-4 font-medium">{formatPrice(Number(order.total))}</td>
                    <td className="py-3 px-4"><Badge variant={order.payment_status === "approved" ? "default" : order.payment_status === "rejected" ? "destructive" : "secondary"}>{order.payment_status}</Badge></td>
                    <td className="py-3 px-4">
                      <Select value={order.status} disabled={isUpdating} onValueChange={(value) => updateStatus(order, value as OrderStatus)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>{orderStatuses.map((status) => <SelectItem key={status} value={status}>{status === "shipped" ? "On the way" : status}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 px-4">
                      {order.status === "shipped" ? (
                        <div className="flex min-w-56 flex-col gap-2">
                          <Input placeholder="Courier" value={draft.courier} disabled={isUpdating} onChange={(event) => setShippingDraft(order, { courier: event.target.value })} />
                          <Input placeholder="Tracking number" value={draft.trackingNumber} disabled={isUpdating} onChange={(event) => setShippingDraft(order, { trackingNumber: event.target.value })} />
                          <Button size="sm" disabled={isUpdating} onClick={() => updateStatus(order, "shipped")}>{isUpdating ? "Saving…" : "Save shipping"}</Button>
                        </div>
                      ) : <span className="text-muted-foreground">Set fulfillment to shipped to add courier and tracking.</span>}
                    </td>
                    <td className="py-3 px-4"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 ? <tr><td className="py-8 px-4 text-muted-foreground" colSpan={9}>No orders found.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
