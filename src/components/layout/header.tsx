"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { SignInButton, UserButton } from "@/components/authButtons";
import { Menu, X, ShoppingCart, Search, User, Store, Sparkles, Percent, Sun, Moon, LogOut, UserCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useCart } from "@/hooks/use-cart";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const leftLinks = [
  { href: "/products", label: "Shop", icon: Store },
  { href: "/new-drops", label: "New Drop", icon: Sparkles },
  { href: "/archive-sales", label: "Archive Sale", icon: Percent },
  { href: "/about", label: "About Us" },
];

const mobileLinks = [
  { href: "/products", label: "Shop" },
  { href: "/new-drops", label: "New Drop" },
  { href: "/archive-sales", label: "Archive Sale" },
  { href: "/about", label: "About Us" },
  { href: "/collections", label: "Collections" },
];

export function Header() {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/20 backdrop-blur-lg supports-[backdrop-filter]:bg-background/10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Mobile hamburger + search (visible only on mobile) */}
        <div className="flex items-center gap-1 md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <div className="flex flex-col gap-1 mt-8">
                {mobileLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors hover:text-primary hover:bg-muted",
                      pathname === link.href
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-4 pt-4 border-t px-3">
                  {session ? (
                    <div className="flex items-center gap-3">
                      <UserButton />
                      <span className="text-sm font-medium">{session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'}</span>
                    </div>
                  ) : (
                    <SignInButton />
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Left: Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {leftLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary hover:bg-muted",
                pathname === link.href
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Center: Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            wildsoulclub@
          </span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          {/* Search - Desktop only */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Auth - Desktop */}
          <div className="hidden md:block">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    <UserCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'}
                    </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex w-full items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 w-full text-left">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SignInButton />
            )}
          </div>

          {/* Auth - Mobile (profile icon) */}
          <div className="md:hidden">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground" aria-label="Profile">
                    <UserCircle className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Link href="/profile" className="flex w-full items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 w-full text-left">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/sign-up">
                <Button variant="ghost" size="icon" aria-label="Sign in">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>

          {/* Cart */}
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="border-t py-4 px-4 bg-background">
          <div className="container mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
