"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatPrice, getInitials } from "@/lib/utils";

const customers = [
  { id: "1", name: "Thaw Thaw", email: "thaw@example.com", orders: 5, spent: 320000, status: "active" },
  { id: "2", name: "Aung Ko", email: "aung@example.com", orders: 3, spent: 145000, status: "active" },
  { id: "3", name: "Su Su", email: "su@example.com", orders: 8, spent: 520000, status: "active" },
  { id: "4", name: "Min Khant", email: "min@example.com", orders: 1, spent: 35000, status: "inactive" },
];

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customers</h1>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 pb-0">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search customers..." className="pl-10" />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pt-4 px-4 font-medium">Customer</th>
                <th className="pb-3 pt-4 px-4 font-medium">Orders</th>
                <th className="pb-3 pt-4 px-4 font-medium">Total Spent</th>
                <th className="pb-3 pt-4 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback></Avatar>
                      <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{c.orders}</td>
                  <td className="py-3 px-4 font-medium">{formatPrice(c.spent)}</td>
                  <td className="py-3 px-4"><Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
