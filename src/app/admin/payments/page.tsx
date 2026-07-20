"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PaymentRow = {
  id: string;
  order_id: string;
  method: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "expired";
  payment_image: string;
  created_at: string;
  orders?: { order_number?: string; full_name?: string } | null;
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
    const session = await getSession();
    const response = await fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ paymentId, status }),
    });
    const result = await readJson(response);
    if (!response.ok) {
      setError(result.error ?? "Unable to update payment");
      return;
    }
    await loadPayments();
  }

  useEffect(() => { loadPayments(); }, []);

  const filtered = useMemo(() => payments.filter((payment) => {
    const matchesStatus = filter === "all" || payment.status === filter;
    const term = search.toLowerCase().trim();
    const matchesSearch = !term || payment.id.toLowerCase().includes(term) || payment.orders?.order_number?.toLowerCase().includes(term) || payment.orders?.full_name?.toLowerCase().includes(term);
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
                  <td className="py-3 px-4 font-mono text-xs">{payment.orders?.order_number ?? payment.order_id}</td>
                  <td className="py-3 px-4 uppercase">{payment.method}</td>
                  <td className="py-3 px-4 font-medium">{formatPrice(Number(payment.amount))}</td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4"><Badge variant={payment.status === "approved" ? "default" : payment.status === "rejected" ? "destructive" : "secondary"}>{payment.status}</Badge></td>
                  <td className="py-3 px-4"><div className="flex gap-1">{payment.status === "pending" && <><Button size="icon" variant="ghost" className="text-green-600" onClick={() => updateStatus(payment.id, "approved")}><CheckCircle className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-red-600" onClick={() => updateStatus(payment.id, "rejected")}><XCircle className="h-4 w-4" /></Button></>}<Button size="icon" variant="ghost" asChild><a href={payment.payment_image} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /></a></Button></div></td>
                </tr>
              ))}
              {!loading && filtered.length === 0 ? <tr><td className="py-8 px-4 text-muted-foreground" colSpan={7}>No payments found.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
