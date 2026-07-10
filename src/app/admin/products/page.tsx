"use client";

import { useState } from "react";
import { Plus, Search, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";

const products = [
  { id: "1", name: "Classic Logo Tee", category: "T-shirts", price: 35000, stock: 45, status: "active", image: null },
  { id: "2", name: "Wild Soul Hoodie", category: "Hoodies", price: 65000, stock: 12, status: "active", image: null },
  { id: "3", name: "Denim Jacket", category: "Jackets", price: 95000, stock: 0, status: "inactive", image: null },
  { id: "4", name: "Cargo Pants", category: "Pants", price: 55000, stock: 8, status: "active", image: null },
];

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Fill in the product details below.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label>Product Name</Label>
                <Input placeholder="Enter product name" />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea placeholder="Product description" rows={3} />
              </div>
              <div>
                <Label>Price (MMK)</Label>
                <Input type="number" placeholder="35000" />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" placeholder="50" />
              </div>
              <div>
                <Label>Category</Label>
                <Input placeholder="T-shirts" />
              </div>
              <div>
                <Label>Collection</Label>
                <Input placeholder="Summer" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button>Save Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                          Img
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3">{product.category}</td>
                    <td className="py-3">{formatPrice(product.price)}</td>
                    <td className="py-3">
                      <span className={product.stock === 0 ? "text-red-500" : ""}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge variant={product.status === "active" ? "default" : "secondary"}>
                        {product.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <DropdownMenu>
                      <Button variant="ghost" size="icon" onClick={() => {}}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
