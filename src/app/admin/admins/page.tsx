import { useEffect, useState } from "react";
import { Plus, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { getInitials } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const [admins, setAdmins] = useState([]);

useEffect(() => {
  const fetchAdmins = async () => {
    const { data, error } = await supabase.from("admins").select("*");
    if (error) console.error("Error fetching admins:", error);
    else setAdmins(data || []);
  };
  fetchAdmins();
}, []);

return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Admin Management</h1>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Admin</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Admin</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Email</Label><Input type="email" placeholder="admin@wildsoulclub.com" /></div>
            <div><Label>Role</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option>superadmin</option>
                <option>admin</option>
                <option>manager</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 pt-4 px-4 font-medium">Admin</th>
              <th className="pb-3 pt-4 px-4 font-medium">Role</th>
              <th className="pb-3 pt-4 px-4 font-medium">Status</th>
              <th className="pb-3 pt-4 px-4 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{getInitials(a.name)}</AvatarFallback></Avatar>
                    <div><p className="font-medium">{a.name}</p><p className="text-xs text-muted-foreground">{a.email}</p></div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    {a.role}
                  </div>
                </td>
                <td className="py-3 px-4"><Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge></td>
                <td className="py-3 px-4">
                  <Button variant="ghost" size="icon" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  </div>
);
