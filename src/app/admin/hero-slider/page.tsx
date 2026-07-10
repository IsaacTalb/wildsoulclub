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

const slides = [
  { id: "1", title: "Wild Soul Club", subtitle: "Streetwear for the bold", cta: "Shop Now", active: true, order: 1 },
  { id: "2", title: "Summer Collection", subtitle: "Light & breezy fits", cta: "Explore", active: true, order: 2 },
  { id: "3", title: "New Drops", subtitle: "Fresh styles every month", cta: "View", active: false, order: 3 },
];

export default function AdminHeroSliderPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hero Slider</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Slide</Button>
          <DialogContent>
            <DialogHeader><DialogTitle>New Slide</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Title</Label><Input placeholder="Wild Soul Club" /></div>
              <div><Label>Subtitle</Label><Input placeholder="Streetwear for the bold" /></div>
              <div><Label>CTA Text</Label><Input placeholder="Shop Now" /></div>
              <div><Label>Order</Label><Input type="number" placeholder="1" /></div>
              <div>
                <Label>Background Image</Label>
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
                <th className="pb-3 pt-4 px-4 font-medium">Order</th>
                <th className="pb-3 pt-4 px-4 font-medium">Title</th>
                <th className="pb-3 pt-4 px-4 font-medium">Subtitle</th>
                <th className="pb-3 pt-4 px-4 font-medium">CTA</th>
                <th className="pb-3 pt-4 px-4 font-medium">Status</th>
                <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {slides.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-3 px-4">{s.order}</td>
                  <td className="py-3 px-4 font-medium">{s.title}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.subtitle}</td>
                  <td className="py-3 px-4">{s.cta}</td>
                  <td className="py-3 px-4"><Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Active" : "Inactive"}</Badge></td>
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
