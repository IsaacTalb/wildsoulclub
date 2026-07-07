"use client";

import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  Clock,
  DollarSign,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const statsCards = [
  {
    title: "Total Revenue",
    value: 24580000,
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Total Orders",
    value: 156,
    change: "+8.2%",
    trend: "up",
    icon: ShoppingBag,
  },
  {
    title: "Total Products",
    value: 89,
    change: "+3",
    trend: "up",
    icon: Package,
  },
  {
    title: "Total Customers",
    value: 1245,
    change: "+15.3%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Pending Payments",
    value: 12,
    change: "-2",
    trend: "down",
    icon: Clock,
  },
  {
    title: "Today's Sales",
    value: 1250000,
    change: "+5.7%",
    trend: "up",
    icon: TrendingUp,
  },
];

const recentOrders = [
  { id: "WSC-20260701", customer: "Thaw Thaw", total: 85000, status: "paid", items: 3 },
  { id: "WSC-20260702", customer: "Aung Ko", total: 45000, status: "pending", items: 1 },
  { id: "WSC-20260703", customer: "Su Su", total: 120000, status: "processing", items: 4 },
  { id: "WSC-20260704", customer: "Min Khant", total: 35000, status: "shipped", items: 2 },
  { id: "WSC-20260705", customer: "Hla Hla", total: 65000, status: "delivered", items: 2 },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <Badge
                  variant="outline"
                  className={stat.trend === "up" ? "text-green-600" : "text-red-600"}
                >
                  {stat.trend === "up" ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold">
                {typeof stat.value === "number" && stat.value > 1000
                  ? formatPrice(stat.value)
                  : stat.value.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-3 font-mono text-xs">{order.id}</td>
                    <td className="py-3">{order.customer}</td>
                    <td className="py-3">{order.items}</td>
                    <td className="py-3 font-medium">{formatPrice(order.total)}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          order.status === "paid" || order.status === "delivered"
                            ? "default"
                            : order.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Sales Chart (Coming Soon)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Products Chart (Coming Soon)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
