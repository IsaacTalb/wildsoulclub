"use client";

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
import { useState } from "react";

const townships = [
  { id: "1", name: "Hlaing", city: "Yangon" },
  { id: "2", name: "Kamayut", city: "Yangon" },
  { id: "3", name: "Sanchaung", city: "Yangon" },
  { id: "4", name: "Mandalay", city: "Mandalay" },
  { id: "5", name: "Pyin Oo Lwin", city: "Mandalay" },
  { id: "6", name: "Dekkhinathiri", city: "Naypyidaw" },
];

export default function AdminTownshipsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Townships</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Township</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Township</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Township Name</Label><Input placeholder="e.g. Hlaing" /></div>
              <div><Label>City</Label><Input placeholder="e.g. Yangon" /></div>
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
                <th className="pb-3 pt-4 px-4 font-medium">Township</th>
                <th className="pb-3 pt-4 px-4 font-medium">City</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {townships.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium">{t.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.city}</td>
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
