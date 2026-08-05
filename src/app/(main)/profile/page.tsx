"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Mail, MapPin, Package, Pencil, Phone, Plus, Trash2, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice, getInitials } from "@/lib/utils";

type OrderItem = { id: string; quantity: number; price: number; product_id: string; products?: { name?: string | null } | null };
type Order = {
  id: string; order_number: string; payment_reference?: string | null; created_at: string;
  total: number; status: string; payment_status: string; fulfillment_method: string;
  order_items?: OrderItem[]; payments?: { payment_image?: string | null }[];
};
type Address = {
  id: string; full_name: string; phone: string; address: string; township: string;
  city: string; state: string; zip?: string | null; is_default: boolean; created_at: string;
};
type AddressForm = {
  fullName: string; phone: string; address: string; township: string;
  city: string; state: string; zip: string; isDefault: boolean;
};

const emptyAddress: AddressForm = { fullName: "", phone: "", address: "", township: "", city: "", state: "", zip: "", isDefault: false };

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setAuthReady(true);
    if (!nextSession) return;
    const metadata = nextSession.user.user_metadata;
    const storedFullName = String(metadata.full_name ?? "").trim();
    const [first, ...rest] = storedFullName.split(/\s+/);
    setFirstName(String(metadata.first_name ?? first ?? ""));
    setLastName(String(metadata.last_name ?? rest.join(" ")));
    setPhone(String(metadata.phone ?? ""));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => applySession(nextSession));
    return () => subscription.unsubscribe();
  }, [applySession]);

  const authHeaders = useCallback(() => session ? { Authorization: `Bearer ${session.access_token}` } : undefined, [session]);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch("/api/profile", { headers: authHeaders(), signal: controller.signal, cache: "no-store" })
        .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Unable to load profile"); return result.data as { full_name?: string | null; phone?: string | null } | null; })
        .then((profile) => {
          if (!profile) return;
          const [first, ...rest] = String(profile.full_name ?? "").trim().split(/\s+/);
          setFirstName(first ?? ""); setLastName(rest.join(" ")); setPhone(profile.phone ?? "");
        })
        .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to load profile." }); });
    }, 0);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [authHeaders, session]);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoadingOrders(true);
      fetch("/api/orders", { headers: authHeaders(), signal: controller.signal })
        .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Unable to load orders"); setOrders(result.data ?? []); })
        .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to load orders." }); })
        .finally(() => setLoadingOrders(false));
    }, 0);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [authHeaders, session]);

  const loadAddresses = useCallback(async () => {
    if (!session) return;
    setLoadingAddresses(true);
    try {
      const response = await fetch("/api/profile/addresses", { headers: authHeaders(), cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load addresses");
      setAddresses(result.data ?? []);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to load addresses." });
    } finally { setLoadingAddresses(false); }
  }, [authHeaders, session]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadAddresses(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadAddresses]);

  async function handleUpdateProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;
    setSavingProfile(true); setMessage(null);
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const fullName = `${cleanFirst} ${cleanLast}`.trim();
    try {
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName, first_name: cleanFirst, last_name: cleanLast, phone: phone.trim() },
      });
      if (authError) throw authError;
      const response = await fetch("/api/profile", {
        method: "PATCH", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: cleanFirst, lastName: cleanLast, phone }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to update profile");
      if (authData.user) setSession((current) => current ? { ...current, user: authData.user } : current);
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to update profile." });
    } finally { setSavingProfile(false); }
  }

  async function handleAddAddress(event: React.FormEvent) {
    event.preventDefault();
    setSavingAddress(true); setMessage(null);
    try {
      const response = await fetch("/api/profile/addresses", {
        method: editingAddressId ? "PATCH" : "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(editingAddressId ? { ...addressForm, id: editingAddressId } : addressForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save address");
      setAddressForm(emptyAddress); setEditingAddressId(null); setShowAddressForm(false);
      await loadAddresses();
      setMessage({ type: "success", text: editingAddressId ? "Address updated successfully." : "Address saved successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save address." });
    } finally { setSavingAddress(false); }
  }

  async function removeAddress(id: string) {
    setMessage(null);
    const response = await fetch(`/api/profile/addresses?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeaders() });
    const result = await response.json();
    if (!response.ok) { setMessage({ type: "error", text: result.error ?? "Unable to remove address." }); return; }
    await loadAddresses();
    setMessage({ type: "success", text: "Address removed." });
  }

  function editAddress(address: Address) {
    setEditingAddressId(address.id);
    setAddressForm({ fullName: address.full_name, phone: address.phone, address: address.address, township: address.township, city: address.city, state: address.state, zip: address.zip ?? "", isDefault: address.is_default });
    setShowAddressForm(true);
    setMessage(null);
  }

  function closeAddressForm() {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddress);
  }

  if (!authReady) return <div className="container mx-auto px-4 py-12 text-left text-muted-foreground">Loading profile…</div>;
  if (!session) return <div className="container mx-auto px-4 py-12 text-left">Please sign in to view your profile.</div>;

  const user = session.user;
  const fullName = String(user.user_metadata.full_name ?? `${firstName} ${lastName}`.trim() ?? user.email?.split("@")[0] ?? "User");

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-center gap-4 text-left sm:mb-8">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/20 font-semibold text-primary sm:h-16 sm:w-16">{getInitials(fullName || user.email || "User")}</div>
        <div className="min-w-0"><h1 className="truncate text-xl font-bold sm:text-2xl">{fullName}</h1><p className="truncate text-sm text-muted-foreground">{user.email}</p></div>
      </div>

      {message && <div role="status" className={`mb-5 rounded-md p-3 text-left text-sm ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-destructive/10 text-destructive"}`}>{message.text}</div>}

      <Tabs defaultValue="profile" className="w-full text-left">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 sm:max-w-xl">
          <TabsTrigger value="profile" className="min-w-0"><User className="mr-1.5 h-4 w-4 shrink-0" /><span className="truncate">Profile</span></TabsTrigger>
          <TabsTrigger value="orders" className="min-w-0"><Package className="mr-1.5 h-4 w-4 shrink-0" /><span className="truncate">Orders</span></TabsTrigger>
          <TabsTrigger value="addresses" className="min-w-0"><MapPin className="mr-1.5 h-4 w-4 shrink-0" /><span className="truncate">Addresses</span></TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-5">
          <Card><CardHeader><CardTitle className="text-lg">Personal Information</CardTitle></CardHeader><CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="first-name">First Name</Label><Input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="last-name">Last Name</Label><Input id="last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} /></div></div>
              <div className="space-y-2"><Label htmlFor="profile-email">Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="profile-email" value={user.email ?? ""} readOnly className="pl-10" /></div></div>
              <div className="space-y-2"><Label htmlFor="profile-phone">Phone</Label><div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="profile-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="pl-10" /></div></div>
              <Button type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save Changes"}</Button>
            </form>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-5">
          {loadingOrders ? <p className="py-10 text-left text-muted-foreground">Loading orders…</p> : orders.length === 0 ? <Card><CardContent className="p-8 text-left text-muted-foreground"><Package className="mb-3 h-10 w-10 opacity-50" /><p className="font-medium text-foreground">No orders yet</p><p className="text-sm">Your order history will appear here.</p></CardContent></Card> : <div className="space-y-4">{orders.map((order) => <Card key={order.id}><CardContent className="p-4 sm:p-6"><div className="flex flex-col items-start justify-between gap-3 sm:flex-row"><div><p className="font-medium">Order {order.order_number}</p>{order.payment_reference && <p className="mt-1 break-all font-mono text-xs font-semibold">Payment ref: {order.payment_reference}</p>}<p className="mt-1 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p></div><div className="text-left sm:text-right"><p className="text-lg font-bold">{formatPrice(Number(order.total))}</p><Badge variant={order.status === "pending" ? "outline" : "default"}>{order.status}</Badge></div></div><div className="mt-4 space-y-2 border-t pt-4">{order.order_items?.map((item) => <div key={item.id} className="flex flex-col justify-between gap-1 text-sm min-[420px]:flex-row"><span>{item.quantity} × {item.products?.name || "Product"}</span><span>{formatPrice(Number(item.price ?? 0))}</span></div>)}<p className="border-t pt-3 text-sm text-muted-foreground">{order.fulfillment_method === "pickup" ? "Store pickup" : "Delivery"} · Payment {order.payment_status}</p></div></CardContent></Card>)}</div>}
        </TabsContent>

        <TabsContent value="addresses" className="mt-5 space-y-4">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold">Saved Addresses</h2><p className="text-sm text-muted-foreground">Checkout delivery addresses are saved automatically and remain editable here.</p></div><Button type="button" onClick={() => { if (showAddressForm && !editingAddressId) { closeAddressForm(); return; } setEditingAddressId(null); setAddressForm({ ...emptyAddress, fullName, phone }); setShowAddressForm(true); }}><Plus className="mr-2 h-4 w-4" />Add Address</Button></div>
          {showAddressForm && <Card><CardHeader><CardTitle className="text-lg">{editingAddressId ? "Edit Address" : "New Address"}</CardTitle></CardHeader><CardContent><form onSubmit={handleAddAddress} className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="address-name">Full Name</Label><Input id="address-name" value={addressForm.fullName} onChange={(event) => setAddressForm({ ...addressForm, fullName: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="address-phone">Phone</Label><Input id="address-phone" type="tel" value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value })} required /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="street-address">Address</Label><Input id="street-address" value={addressForm.address} onChange={(event) => setAddressForm({ ...addressForm, address: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="township">Township</Label><Input id="township" value={addressForm.township} onChange={(event) => setAddressForm({ ...addressForm, township: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="state">State/Region</Label><Input id="state" value={addressForm.state} onChange={(event) => setAddressForm({ ...addressForm, state: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="zip">Postal Code</Label><Input id="zip" value={addressForm.zip} onChange={(event) => setAddressForm({ ...addressForm, zip: event.target.value })} /></div><label className="flex items-center gap-2 text-sm sm:col-span-2"><Checkbox checked={addressForm.isDefault} onCheckedChange={(checked) => setAddressForm({ ...addressForm, isDefault: checked === true })} />Make this my default address</label><div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" disabled={savingAddress}>{savingAddress ? "Saving…" : editingAddressId ? "Update Address" : "Save Address"}</Button><Button type="button" variant="outline" onClick={closeAddressForm}>Cancel</Button></div></form></CardContent></Card>}
          {loadingAddresses ? <p className="py-8 text-left text-muted-foreground">Loading addresses…</p> : addresses.length === 0 ? <Card><CardContent className="p-8 text-left text-muted-foreground"><MapPin className="mb-3 h-10 w-10 opacity-50" /><p className="font-medium text-foreground">No saved addresses</p><p className="text-sm">Add an address or place a delivery order to save one automatically.</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{addresses.map((address) => <Card key={address.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{address.full_name}</p>{address.is_default && <Badge>Default</Badge>}</div><p className="mt-2 break-words text-sm">{address.address}</p><p className="text-sm">{address.township}, {address.city}, {address.state}{address.zip ? ` ${address.zip}` : ""}</p><a href={`tel:${address.phone}`} className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><Phone className="h-3.5 w-3.5" />{address.phone}</a></div><div className="flex shrink-0"><Button type="button" variant="ghost" size="icon" className="text-muted-foreground" onClick={() => editAddress(address)} aria-label={`Edit address for ${address.full_name}`}><Pencil className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => void removeAddress(address.id)} aria-label={`Remove address for ${address.full_name}`}><Trash2 className="h-4 w-4" /></Button></div></div></CardContent></Card>)}</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
