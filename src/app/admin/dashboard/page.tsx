"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, DollarSign, Package, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

type DashboardReport = {
  timezone: string;
  generatedAt: string;
  boundaries: {
    todayStart: string;
    todayEndExclusive: string;
    monthlyStart: string;
    monthlyEndExclusive: string;
  };
  stats: {
    revenue: number;
    orders: number;
    products: number;
    customers: number;
    pending_payments: number;
    today_sales: number;
  };
  monthlySales: Array<{ month: string; revenue: number; orders: number }>;
  recentOrders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    is_guest: boolean;
    item_count: number;
    total: number;
    status: string;
    payment_status: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    sku: string | null;
    units_sold: number;
    stock_remaining: number;
    variants: Array<{
      id: string;
      sku: string | null;
      size: string | null;
      color: string | null;
      unitsSold: number;
      stockRemaining: number;
    }>;
  }>;
};

const statDefinitions = [
  { key: "revenue", title: "Paid Revenue", icon: DollarSign, money: true },
  { key: "orders", title: "Total Orders", icon: ShoppingBag, money: false },
  { key: "products", title: "Total Products", icon: Package, money: false },
  { key: "customers", title: "Registered Customers", icon: Users, money: false },
  { key: "pending_payments", title: "Pending Payments", icon: Clock, money: false },
  { key: "today_sales", title: "Today's Paid Sales", icon: TrendingUp, money: true },
] as const;

function monthLabel(month: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`)
  );
}

export default function AdminDashboardPage() {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Your session has expired. Sign in again to view reporting.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? "Unable to load dashboard");
      setReport(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">Live commerce and inventory reporting</p>
        </div>
        {report ? (
          <p className="text-xs text-muted-foreground">
            Calendar: {report.timezone} · refreshed {new Date(report.generatedAt).toLocaleString()}
          </p>
        ) : null}
      </div>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void loadDashboard()}>Try again</Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" aria-busy={loading}>
        {loading
          ? statDefinitions.map(({ title }) => <Skeleton key={title} className="h-28 rounded-xl" />)
          : report
            ? statDefinitions.map((definition) => {
                const value = Number(report.stats[definition.key]);
                return (
                  <Card key={definition.key}>
                    <CardContent className="p-4">
                      <definition.icon className="mb-3 h-5 w-5 text-muted-foreground" />
                      <p className="text-2xl font-bold">{definition.money ? formatPrice(value) : value.toLocaleString()}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{definition.title}</p>
                    </CardContent>
                  </Card>
                );
              })
            : null}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Orders</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-48 w-full" /> : report?.recentOrders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left">
                  <th className="pb-3 font-medium">Order</th><th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Units</th><th className="pb-3 font-medium">Total</th><th className="pb-3 font-medium">Status</th>
                </tr></thead>
                <tbody>{report.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-3 font-mono text-xs">{order.order_number}</td>
                    <td className="py-3"><span className="block">{order.customer_name}</span><span className="text-xs text-muted-foreground">{order.customer_email}{order.is_guest ? " · guest checkout" : ""}</span></td>
                    <td className="py-3">{Number(order.item_count).toLocaleString()}</td>
                    <td className="py-3 font-medium">{formatPrice(Number(order.total))}</td>
                    <td className="py-3"><Badge variant={order.payment_status === "approved" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"}>{order.status} · {order.payment_status}</Badge></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : report ? <p className="py-10 text-center text-sm text-muted-foreground">No orders have been placed yet.</p> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Monthly Paid Sales</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64 w-full" /> : report?.monthlySales.length ? (
              <div className="space-y-3">{report.monthlySales.map((month) => (
                <div key={month.month} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div><p className="font-medium">{monthLabel(month.month)}</p><p className="text-xs text-muted-foreground">{Number(month.orders)} paid orders</p></div>
                  <p className="font-semibold">{formatPrice(Number(month.revenue))}</p>
                </div>
              ))}</div>
            ) : report ? <p className="py-10 text-center text-sm text-muted-foreground">No monthly sales are available.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Top Products</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64 w-full" /> : report?.topProducts.length ? (
              <div className="space-y-4">{report.topProducts.map((product) => (
                <div key={product.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.sku ?? "No SKU"}</p></div>
                    <div className="text-right text-sm"><p><strong>{Number(product.units_sold)}</strong> sold</p><p className="text-muted-foreground">{Number(product.stock_remaining)} remaining</p></div>
                  </div>
                  {product.variants.length ? <div className="mt-2 flex flex-wrap gap-1">{product.variants.map((variant) => (
                    <Badge key={variant.id} variant="outline" className="font-normal">
                      {[variant.size, variant.color].filter(Boolean).join(" / ") || variant.sku || "Variant"}: {Number(variant.unitsSold)} sold · {Number(variant.stockRemaining)} left
                    </Badge>
                  ))}</div> : null}
                </div>
              ))}</div>
            ) : report ? <p className="py-10 text-center text-sm text-muted-foreground">No paid product sales are available.</p> : null}
          </CardContent>
        </Card>
      </div>

      {report ? <p className="text-xs text-muted-foreground">Today is [{new Date(report.boundaries.todayStart).toISOString()}, {new Date(report.boundaries.todayEndExclusive).toISOString()}); monthly trends cover six local calendar months. Revenue and units sold include approved-payment, non-cancelled orders only.</p> : null}
    </div>
  );
}
