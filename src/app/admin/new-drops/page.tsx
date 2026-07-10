"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal, Sparkles } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";

const newDrops = [
  { id: "1", name: "Monsoon Tee", date: "2026-07-01", products: 5, active: true },
  { id: "2", name: "Summer Collection", date: "2026-06-15", products: 8, active: true },
  { id: "3", name: "After Rain", date: "2026-05-20", products: 3, active: false },
];

export default function AdminNewDropsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Drops</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add New Drop</Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Drop</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Drop Name</Label>
                <Input placeholder="e.g., Monsoon 2026" />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Describe this drop..." rows={3} />
              </div>
              <div>
                <Label>Featured Image</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button>Save Drop</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pt-4 px-4 font-medium">Drop Name</th>
                <th className="pb-3 pt-4 px-4 font-medium">Date Range</th>
                <th className="pb-3 pt-4 px-4 font-medium">Products</th>
                <th className="pb-3 pt-4 px-4 font-medium">Status</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {newDrops.map((drop) => (
                <tr key={drop.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium">{drop.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {drop.date} - {drop.active ? "Active" : "Ended"}
                  </td>
                  <td className="py-3 px-4">{drop.products} products</td>
                  <td className="py-3 px-4">
                    <Badge variant={drop.active ? "default" : "secondary"}>
                      {drop.active ? "Active" : "Ended"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {}}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
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
