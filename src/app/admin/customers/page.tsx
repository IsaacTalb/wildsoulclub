"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Phone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { formatDate, formatPrice, getInitials } from "@/lib/utils";

type CustomerRow = {
  id: string; full_name: string; email: string; phone?: string | null;
  order_count: number; paid_order_count: number; paid_total: number; last_order_at?: string | null;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session has expired.");
      const response = await fetch("/api/admin/people", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load customers");
      setCustomers(result.data?.customers ?? []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load customers");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadCustomers(), 0);
    const refresh = () => void loadCustomers(false);
    window.addEventListener("focus", refresh);
    return () => { window.clearTimeout(timeout); window.removeEventListener("focus", refresh); };
  }, [loadCustomers]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((customer) => !term || [customer.full_name, customer.email, customer.phone].some((value) => value?.toLowerCase().includes(term)));
  }, [customers, search]);

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold md:text-3xl">Customers</h1><p className="text-sm text-muted-foreground">Registered users who have placed at least one order.</p></div>
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Card><CardContent className="p-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or phone" className="pl-10" /></div></CardContent></Card>
      {loading ? <p className="py-12 text-center text-muted-foreground">Loading customers…</p> : filtered.length === 0 ? <Card><CardContent className="p-10 text-center text-muted-foreground">No customers found.</CardContent></Card> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((customer) => <Card key={customer.id}><CardContent className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Avatar><AvatarFallback>{getInitials(customer.full_name || customer.email)}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-medium">{customer.full_name || "Unnamed customer"}</p><a href={`mailto:${customer.email}`} className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"><Mail className="h-3 w-3" />{customer.email}</a>{customer.phone && <a href={`tel:${customer.phone}`} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Phone className="h-3 w-3" />{customer.phone}</a>}</div></div><Badge variant={Number(customer.paid_order_count) > 0 ? "default" : "secondary"}>{Number(customer.paid_order_count) > 0 ? "Paid customer" : "Payment pending"}</Badge></div>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-center"><div><p className="font-semibold">{Number(customer.order_count)}</p><p className="text-xs text-muted-foreground">Orders</p></div><div><p className="font-semibold">{Number(customer.paid_order_count)}</p><p className="text-xs text-muted-foreground">Paid</p></div><div><p className="font-semibold">{formatPrice(Number(customer.paid_total))}</p><p className="text-xs text-muted-foreground">Paid total</p></div></div>
            {customer.last_order_at && <p className="text-xs text-muted-foreground">Last order {formatDate(new Date(customer.last_order_at))}</p>}
          </CardContent></Card>)}
        </div>
      )}
    </div>
  );
}
