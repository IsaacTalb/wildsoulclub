"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { TrendingUp, ShoppingBag, DollarSign, Users } from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{formatPrice(24580000)}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <ShoppingBag className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">156</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">83,000</p>
            <p className="text-xs text-muted-foreground">Avg. Order Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Users className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">1,245</p>
            <p className="text-xs text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Revenue Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Revenue Chart (Coming Soon)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Orders Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Orders Chart (Coming Soon)
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Top Products (Coming Soon)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sales by Category</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Category Breakdown (Coming Soon)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Payment Methods (Coming Soon)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
