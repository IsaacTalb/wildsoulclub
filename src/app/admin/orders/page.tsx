"use client";

import { useState } from "react";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const orders = [
  { id: "WSC-20260701", customer: "Thaw Thaw", date: "2026-07-01", total: 85000, status: "paid", items: 3 },
  { id: "WSC-20260702", customer: "Aung Ko", date: "2026-07-02", total: 45000, status: "pending", items: 1 },
  { id: "WSC-20260703", customer: "Su Su", date: "2026-07-03", total: 120000, status: "processing", items: 4 },
  { id: "WSC-20260704", customer: "Min Khant", date: "2026-07-04", total: 35000, status: "shipped", items: 2 },
  { id: "WSC-20260705", customer: "Hla Hla", date: "2026-07-05", total: 65000, status: "delivered", items: 2 },
];

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 pb-0 flex flex-wrap gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search orders..." className="pl-10" />
            </div>
            <Select value={statusFilter || undefined} onValueChange={(value) => setStatusFilter(value || "all")}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
                <th className="pb-3 pt-4 px-4 font-medium">Status</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-mono text-xs">{order.id}</td>
                  <td className="py-3 px-4">{order.customer}</td>
                  <td className="py-3 px-4 text-muted-foreground">{order.date}</td>
                  <td className="py-3 px-4">{order.items}</td>
                  <td className="py-3 px-4 font-medium">{formatPrice(order.total)}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        order.status === "delivered" || order.status === "paid"
                          ? "default"
                          : order.status === "pending"
                          ? "secondary"
                          : order.status === "cancelled"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
