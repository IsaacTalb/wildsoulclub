"use client";

import { Package, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const orders = [
  { id: "WSC-20260701", date: "2026-07-01", total: 85000, status: "delivered", items: 3 },
  { id: "WSC-20260628", date: "2026-06-28", total: 45000, status: "shipped", items: 1 },
  { id: "WSC-20260625", date: "2026-06-25", total: 120000, status: "processing", items: 4 },
];

export default function OrdersPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4">Your order history will appear here</p>
            <a href="/products"><Button>Start Shopping</Button></a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm">{order.id}</p>
                  <p className="text-xs text-muted-foreground mt-1">{order.date} &middot; {order.items} items</p>
                  <p className="font-medium mt-1">{formatPrice(order.total)}</p>
                </div>
                <div className="text-right">
                  <Badge>{order.status}</Badge>
                  <Button variant="ghost" size="sm" className="mt-2 w-full">
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
