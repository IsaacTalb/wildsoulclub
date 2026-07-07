"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";

const coupons = [
  { id: "1", code: "WELCOME10", discount: "10%", minOrder: 50000, usage: 45, maxUsage: 100, active: true, expiry: "2026-12-31" },
  { id: "2", code: "FREESHIP", discount: "Free Delivery", minOrder: 0, usage: 78, maxUsage: 200, active: true, expiry: "2026-12-31" },
  { id: "3", code: "SUMMER20", discount: "20%", minOrder: 100000, usage: 12, maxUsage: 50, active: true, expiry: "2026-09-30" },
];

export default function AdminCouponsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Coupon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Coupon</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div><Label>Code</Label><Input placeholder="WELCOME10" /></div>
              <div><Label>Discount</Label><Input placeholder="10%" /></div>
              <div><Label>Min Order</Label><Input type="number" placeholder="50000" /></div>
              <div><Label>Max Usage</Label><Input type="number" placeholder="100" /></div>
              <div className="col-span-2"><Label>Expiry Date</Label><Input type="date" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pt-4 px-4 font-medium">Code</th>
                <th className="pb-3 pt-4 px-4 font-medium">Discount</th>
                <th className="pb-3 pt-4 px-4 font-medium">Min Order</th>
                <th className="pb-3 pt-4 px-4 font-medium">Usage</th>
                <th className="pb-3 pt-4 px-4 font-medium">Expiry</th>
                <th className="pb-3 pt-4 px-4 font-medium">Status</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-mono text-xs font-medium">{c.code}</td>
                  <td className="py-3 px-4">{c.discount}</td>
                  <td className="py-3 px-4">{c.minOrder > 0 ? formatPrice(c.minOrder) : "-"}</td>
                  <td className="py-3 px-4">{c.usage}/{c.maxUsage}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.expiry}</td>
                  <td className="py-3 px-4"><Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Active" : "Inactive"}</Badge></td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
