"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const inventory = [
  { id: "1", name: "Classic Logo Tee", sku: "WSC-TEE-001", size: "M", color: "Black", stock: 45, lowStock: false },
  { id: "2", name: "Classic Logo Tee", sku: "WSC-TEE-001", size: "L", color: "Black", stock: 32, lowStock: false },
  { id: "3", name: "Classic Logo Tee", sku: "WSC-TEE-001", size: "XL", color: "White", stock: 3, lowStock: true },
  { id: "4", name: "Wild Soul Hoodie", sku: "WSC-HOD-002", size: "M", color: "Navy", stock: 12, lowStock: false },
  { id: "5", name: "Wild Soul Hoodie", sku: "WSC-HOD-002", size: "L", color: "Navy", stock: 0, lowStock: true },
];

export default function AdminInventoryPage() {
  const [search, setSearch] = useState("");

  const filtered = inventory.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory</h1>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 pb-0">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search inventory..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pt-4 px-4 font-medium">Product</th>
                <th className="pb-3 pt-4 px-4 font-medium">SKU</th>
                <th className="pb-3 pt-4 px-4 font-medium">Size</th>
                <th className="pb-3 pt-4 px-4 font-medium">Color</th>
                <th className="pb-3 pt-4 px-4 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={`${item.id}-${item.size}-${item.color}`} className="border-b last:border-0">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 font-mono text-xs">{item.sku}</td>
                  <td className="py-3 px-4">{item.size}</td>
                  <td className="py-3 px-4">{item.color}</td>
                  <td className="py-3 px-4">
                    <span className={item.lowStock ? "text-red-500 font-medium" : ""}>
                      {item.stock}
                      {item.lowStock && <Badge variant="outline" className="ml-2 text-red-500 border-red-500">Low</Badge>}
                    </span>
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
