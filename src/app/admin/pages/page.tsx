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
import { Textarea } from "@/components/ui/textarea";

const pages = [
  { id: "1", title: "About Us", slug: "about", updated: "2026-07-01" },
  { id: "2", title: "Delivery Information", slug: "delivery", updated: "2026-07-01" },
  { id: "3", title: "Privacy Policy", slug: "privacy", updated: "2026-07-01" },
  { id: "4", title: "Terms & Conditions", slug: "terms", updated: "2026-07-01" },
];

export default function AdminPagesPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pages</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Page</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Page</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Page Title</Label><Input placeholder="About Us" /></div>
              <div><Label>Slug</Label><Input placeholder="about-us" /></div>
              <div><Label>Content</Label><Textarea placeholder="Page content (Markdown supported)" rows={8} /></div>
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
                <th className="pb-3 pt-4 px-4 font-medium">Title</th>
                <th className="pb-3 pt-4 px-4 font-medium">Slug</th>
                <th className="pb-3 pt-4 px-4 font-medium">Last Updated</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium">{p.title}</td>
                  <td className="py-3 px-4 text-muted-foreground">{p.slug}</td>
                  <td className="py-3 px-4 text-muted-foreground">{p.updated}</td>
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
