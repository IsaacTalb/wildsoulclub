"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Phone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { formatDate, getInitials } from "@/lib/utils";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  created_at: string;
  order_count: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session has expired.");
      const response = await fetch("/api/admin/people", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load users");
      setUsers(result.data?.users ?? []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadUsers(), 0);
    const refresh = () => void loadUsers(false);
    window.addEventListener("focus", refresh);
    return () => { window.clearTimeout(timeout); window.removeEventListener("focus", refresh); };
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => !term || [user.full_name, user.email, user.phone].some((value) => value?.toLowerCase().includes(term)));
  }, [search, users]);

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold md:text-3xl">Users</h1><p className="text-sm text-muted-foreground">All registered storefront accounts from live data.</p></div>
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Card><CardContent className="p-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or phone" className="pl-10" /></div></CardContent></Card>
      {loading ? <p className="py-12 text-center text-muted-foreground">Loading users…</p> : filtered.length === 0 ? <Card><CardContent className="p-10 text-center text-muted-foreground">No users found.</CardContent></Card> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((user) => <Card key={user.id}><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3"><Avatar><AvatarFallback>{getInitials(user.full_name || user.email)}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-medium">{user.full_name || "Unnamed user"}</p><a href={`mailto:${user.email}`} className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"><Mail className="h-3 w-3" />{user.email}</a>{user.phone && <a href={`tel:${user.phone}`} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Phone className="h-3 w-3" />{user.phone}</a>}</div></div>
            <div className="flex items-center justify-between gap-4 sm:block sm:text-right"><Badge variant="outline">Registered</Badge><p className="mt-1 text-sm font-medium">{Number(user.order_count)} orders</p><p className="text-xs text-muted-foreground">Joined {formatDate(new Date(user.created_at))}</p></div>
          </CardContent></Card>)}
        </div>
      )}
    </div>
  );
}
