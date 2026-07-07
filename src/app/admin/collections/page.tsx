"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

const collections = [
  { id: "1", name: "After Rain", slug: "after-rain", products: 8, active: true },
  { id: "2", name: "Monsoon 2026", slug: "monsoon-2026", products: 12, active: true },
  { id: "3", name: "Summer", slug: "summer", products: 6, active: true },
  { id: "4", name: "Limited Edition", slug: "limited", products: 4, active: true },
];

export default function AdminCollectionsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Collection</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Collection Name</Label>
                <Input placeholder="e.g. Summer 2026" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input placeholder="summer-2026" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Brief description" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button>Create Collection</Button>
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
                <th className="pb-3 pt-4 px-4 font-medium">Status</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.slug}</td>
                  <td className="py-3 px-4">{c.products}</td>
                  <td className="py-3 px-4">
                    <Badge variant={c.active ? "default" : "secondary"}>
                      {c.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
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
