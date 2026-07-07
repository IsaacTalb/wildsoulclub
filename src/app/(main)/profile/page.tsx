"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials, formatDate } from "@/lib/utils";
import { User, Mail, Phone, MapPin, Package } from "lucide-react";

export default function ProfilePage() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.imageUrl} />
          <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : "U"}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user?.fullName || "User"}</h1>
          <p className="text-muted-foreground text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input defaultValue={user?.firstName || ""} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input defaultValue={user?.lastName || ""} />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input defaultValue={user?.primaryEmailAddress?.emailAddress || ""} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <Input placeholder="09-xxxxxxxxx" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3" />
                <p>No orders yet</p>
                <a href="/products">
                  <Button variant="outline" className="mt-3">Start Shopping</Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3" />
                <p>No addresses saved yet</p>
                <Button variant="outline" className="mt-3">Add Address</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
