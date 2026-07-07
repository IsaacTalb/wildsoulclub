"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const fees = [
  { id: "1", township: "Yangon (City)", fee: 3000 },
  { id: "2", township: "Yangon (郊区)", fee: 5000 },
  { id: "3", township: "Mandalay", fee: 5000 },
  { id: "4", township: "Naypyidaw", fee: 5000 },
  { id: "5", township: "Other Regions", fee: 8000 },
];

export default function AdminDeliveryFeePage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Delivery Fees</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Fee</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Delivery Fee</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Township/Region</Label><Input placeholder="e.g. Yangon" /></div>
              <div><Label>Delivery Fee (MMK)</Label><Input type="number" placeholder="3000" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pt-4 px-4 font-medium">Township / Region</th>
                <th className="pb-3 pt-4 px-4 font-medium">Fee</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium">{f.township}</td>
                  <td className="py-3 px-4">{formatPrice(f.fee)}</td>
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
