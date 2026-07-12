"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials } from "@/lib/utils";
import { User, Mail, Phone, MapPin, Package } from "lucide-react";

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Extract first and last name from user_metadata on mount
  useEffect(() => {
    if (session?.user?.user_metadata?.full_name) {
      const fullName = session.user.user_metadata.full_name;
      const [first, ...last] = fullName.split(" ");
      setFirstName(first || "");
      setLastName(last.join(" ") || "");
    } else if (session?.user?.user_metadata?.first_name) {
      setFirstName(session.user.user_metadata.first_name);
      setLastName(session.user.user_metadata.last_name || "");
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess("Profile updated successfully!");
    setLoading(false);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  const user = session.user;
  const fullName = user.user_metadata?.full_name || `${firstName} ${lastName}`.trim() || user.email?.split("@")[0] || "User";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 flex items-center justify-center bg-primary/20 text-primary rounded-full">
          {getInitials(`${firstName && lastName ? `${firstName[0]}${lastName[0]}` : user.email?.[0] ?? "U"}`)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{(user.user_metadata?.full_name || user.email?.split("@")[0]) ?? "User"}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-[200px] grid-cols-1">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Package className="h-4 w-4 mr-2" /> Orders
          </TabsTrigger>
          <TabsTrigger value="addresses">
            <MapPin className="h-4 w-4 mr-2" /> Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          {success && (
            <div className="bg-green-100 text-green-800 text-sm p-3 rounded-md">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <p className="text-center py-8">Your order history will appear here.</p>
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <p className="text-center py-8">Your saved addresses will appear here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}