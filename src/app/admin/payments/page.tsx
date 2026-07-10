"use client";

import { useState } from "react";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
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

const payments = [
  { id: "PAY-001", order: "WSC-20260701", method: "KBZPay", amount: 85000, status: "verified", date: "2026-07-01" },
  { id: "PAY-002", order: "WSC-20260702", method: "Wave Money", amount: 45000, status: "pending", date: "2026-07-02" },
  { id: "PAY-003", order: "WSC-20260703", method: "AYA Pay", amount: 120000, status: "rejected", date: "2026-07-03" },
  { id: "PAY-004", order: "WSC-20260704", method: "CB Pay", amount: 35000, status: "pending", date: "2026-07-04" },
];

export default function AdminPaymentsPage() {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 pb-0 flex gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search payments..." className="pl-10" />
            </div>
            <Select value={filter || undefined} onValueChange={(value) => setFilter(value || "all")}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pt-4 px-4 font-medium">Payment ID</th>
                <th className="pb-3 pt-4 px-4 font-medium">Order</th>
                <th className="pb-3 pt-4 px-4 font-medium">Method</th>
                <th className="pb-3 pt-4 px-4 font-medium">Amount</th>
                <th className="pb-3 pt-4 px-4 font-medium">Date</th>
                <th className="pb-3 pt-4 px-4 font-medium">Status</th>
                <th className="pb-3 pt-4 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-mono text-xs">{p.id}</td>
                  <td className="py-3 px-4 font-mono text-xs">{p.order}</td>
                  <td className="py-3 px-4">{p.method}</td>
                  <td className="py-3 px-4 font-medium">{formatPrice(p.amount)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{p.date}</td>
                  <td className="py-3 px-4">
                    <Badge variant={p.status === "verified" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {p.status === "pending" && (
                        <>
                          <Button size="icon" variant="ghost" className="text-green-600"><CheckCircle className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-red-600"><XCircle className="h-4 w-4" /></Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button>
                    </div>
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
