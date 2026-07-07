"use client";

import { Search, Ban, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";

const users = [
  { id: "1", name: "Thaw Thaw", email: "thaw@example.com", orders: 5, joined: new Date("2026-01-15"), status: "active" },
  { id: "2", name: "Aung Ko", email: "aung@example.com", orders: 3, joined: new Date("2026-02-20"), status: "active" },
  { id: "3", name: "Su Su", email: "su@example.com", orders: 8, joined: new Date("2025-12-01"), status: "active" },
  { id: "4", name: "Min Khant", email: "min@example.com", orders: 1, joined: new Date("2026-06-10"), status: "banned" },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 pb-0">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-10" />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pt-4 px-4 font-medium">User</th>
                <th className="pb-3 pt-4 px-4 font-medium">Orders</th>
                <th className="pb-3 pt-4 px-4 font-medium">Joined</th>
                <th className="pb-3 pt-4 px-4 font-medium">Status</th>
                <th className="pb-3 pt-4 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback></Avatar>
                      <div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{u.orders}</td>
                  <td className="py-3 px-4 text-muted-foreground">{formatDate(u.joined)}</td>
                  <td className="py-3 px-4"><Badge variant={u.status === "active" ? "default" : "destructive"}>{u.status}</Badge></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Ban className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                    </div>
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
