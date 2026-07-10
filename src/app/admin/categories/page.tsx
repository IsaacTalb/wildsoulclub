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

const categories = [
  { id: "1", name: "T-shirts", slug: "t-shirts", products: 25 },
  { id: "2", name: "Hoodies", slug: "hoodies", products: 15 },
  { id: "3", name: "Jackets", slug: "jackets", products: 8 },
  { id: "4", name: "Pants", slug: "pants", products: 12 },
  { id: "5", name: "Accessories", slug: "accessories", products: 20 },
];

export default function AdminCategoriesPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
          <DialogContent>
            <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Category Name</Label>
                <Input placeholder="e.g. T-shirts" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input placeholder="t-shirts" />
              </div>
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
                <th className="pb-3 pt-4 px-4 font-medium">Name</th>
                <th className="pb-3 pt-4 px-4 font-medium">Slug</th>
                <th className="pb-3 pt-4 px-4 font-medium">Products</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.slug}</td>
                  <td className="py-3 px-4">{c.products}</td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <Button variant="ghost" size="icon" onClick={() => {}}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
