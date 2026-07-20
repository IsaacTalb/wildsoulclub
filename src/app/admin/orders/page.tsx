"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OrderRow = {
  id: string;
  order_number: string;
  full_name: string;
  created_at: string;
  total: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: "pending" | "approved" | "rejected" | "expired";
  order_items?: unknown[];
};

const orderStatuses: OrderRow["status"][] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function getSession() {
  const { data: { session } } = await (await import("@/lib/supabase")).supabase.auth.getSession();
  return session;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const session = await getSession();
      const response = await fetch("/api/admin/orders", { headers: session ? { Authorization: `Bearer ${session.access_token}` } : {} });
      const result = await readJson(response);
      if (!response.ok) throw new Error(result.error ?? "Unable to load orders");
      setOrders(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: OrderRow["status"]) {
    const session = await getSession();
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ orderId, status }),
    });
    const result = await readJson(response);
    if (!response.ok) {
      setError(result.error ?? "Unable to update order");
      return;
    }
    await loadOrders();
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
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

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
                <th className="pb-3 pt-4 px-4 font-medium">Status</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td className="py-8 px-4 text-muted-foreground" colSpan={8}>Loading orders…</td></tr> : filtered.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-mono text-xs">{order.order_number}</td>
                  <td className="py-3 px-4">{order.full_name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{order.order_items?.length ?? 0}</td>
                  <td className="py-3 px-4 font-medium">{formatPrice(Number(order.total))}</td>
                  <td className="py-3 px-4"><Badge variant={order.payment_status === "approved" ? "default" : order.payment_status === "rejected" ? "destructive" : "secondary"}>{order.payment_status}</Badge></td>
                  <td className="py-3 px-4">
                    <Select value={order.status} onValueChange={(value) => updateStatus(order.id, value as OrderRow["status"])}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{orderStatuses.map((status) => <SelectItem key={status} value={status}>{status === "shipped" ? "On the way" : status}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></td>
                </tr>
              ))}
              {!loading && filtered.length === 0 ? <tr><td className="py-8 px-4 text-muted-foreground" colSpan={8}>No orders found.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
