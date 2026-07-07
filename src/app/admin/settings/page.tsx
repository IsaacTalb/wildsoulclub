"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Website Settings</h1>

      <Card>
        <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Site Name</Label><Input defaultValue="Wild Soul Club" /></div>
          <div><Label>Tagline</Label><Input defaultValue="Myanmar Streetwear Brand" /></div>
          <div><Label>Contact Email</Label><Input type="email" defaultValue="hello@wildsoulclub.com" /></div>
          <div><Label>Contact Phone</Label><Input defaultValue="09-123456789" /></div>
          <div><Label>Address</Label><Textarea defaultValue="Yangon, Myanmar" rows={2} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment Accounts</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>KBZPay Account</Label><Input defaultValue="09987654321" /></div>
          <div><Label>Wave Money Account</Label><Input defaultValue="09987654321" /></div>
          <div><Label>AYA Pay Account</Label><Input defaultValue="09987654321" /></div>
          <div><Label>CB Pay Account</Label><Input defaultValue="09987654321" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Features</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><Label>Free Delivery</Label><p className="text-xs text-muted-foreground">Enable free delivery for orders over 100,000 MMK</p></div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div><Label>Free Delivery Threshold</Label></div>
            <Input type="number" defaultValue={100000} className="w-40" />
          </div>
          <div className="flex items-center justify-between">
            <div><Label>Maintenance Mode</Label><p className="text-xs text-muted-foreground">Hide shop from customers</p></div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="gap-2">
        <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save Settings"}
      </Button>
    </div>
  );
}
