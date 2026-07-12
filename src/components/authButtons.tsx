"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

export function SignInButton() {
  const router = useRouter();

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      console.error("Sign in error:", error);
    }
  };

  return (
    <Button variant="ghost" onClick={handleSignIn}>
      Sign In
    </Button>
  );
}

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <Button variant="ghost" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}

export function UserButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return null;
  }

  const initials = getInitials(
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  );

  return (
    <div className="flex items-center space-x-3">
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
        </p>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}