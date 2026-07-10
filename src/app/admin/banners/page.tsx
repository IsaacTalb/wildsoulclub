"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal, ImagePlus } from "lucide-react";
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

const banners = [
  { id: "1", title: "Summer Sale", subtitle: "Up to 30% off", link: "/collections/summer", active: true },
  { id: "2", title: "New Arrivals", subtitle: "Check out the latest drops", link: "/collections/new-arrival", active: true },
];

export default function AdminBannersPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Banners</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Banner</Button>
          <DialogContent>
            <DialogHeader><DialogTitle>New Banner</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Title</Label><Input placeholder="Summer Sale" /></div>
              <div><Label>Subtitle</Label><Input placeholder="Up to 30% off" /></div>
              <div><Label>Link URL</Label><Input placeholder="/collections/summer" /></div>
              <div>
                <Label>Banner Image</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                </div>
              </div>
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
                <th className="pb-3 pt-4 px-4 font-medium">Title</th>
                <th className="pb-3 pt-4 px-4 font-medium">Subtitle</th>
                <th className="pb-3 pt-4 px-4 font-medium">Link</th>
                <th className="pb-3 pt-4 px-4 font-medium">Status</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium">{b.title}</td>
                  <td className="py-3 px-4 text-muted-foreground">{b.subtitle}</td>
                  <td className="py-3 px-4 text-muted-foreground">{b.link}</td>
                  <td className="py-3 px-4"><Badge variant={b.active ? "default" : "secondary"}>{b.active ? "Active" : "Inactive"}</Badge></td>
                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <Button variant="ghost" size="icon" onClick={() => {}}><MoreHorizontal className="h-4 w-4" /></Button>
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
