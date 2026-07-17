"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, UserRound } from "lucide-react";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function SignInButton() {
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

export function UserButton({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
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
    router.push("/");
    router.refresh();
  };

  if (!user) {
    return null;
  }

  const initials = getInitials(
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  );

  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  return <DropdownMenu><DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"><Avatar className="h-9 w-9 cursor-pointer border"><AvatarFallback>{initials}</AvatarFallback></Avatar></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel><p className="truncate font-medium">{name}</p><p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem render={<Link href="/profile" />}><UserRound className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>{admin && <DropdownMenuItem render={<Link href="/admin/settings" />}><Settings className="mr-2 h-4 w-4" />Website settings</DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
