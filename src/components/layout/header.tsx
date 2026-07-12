"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { SignInButton, SignOutButton } from "@/components/authButtons";
import { Menu, X, ShoppingCart, Search, User, Store, Sparkles, Percent, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useCart } from "@/hooks/use-cart";

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
  { href: "/contact", label: "Contact" },
  { href: "/collections", label: "Collections" },
];

export function Header() {
  const pathname = usePathname();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const { setTheme, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Mobile hamburger + search (visible only on mobile) */}
        <div className="flex items-center gap-1 md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <Button variant="ghost" size="icon" aria-label="Menu" onClick={() => setIsOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </Sheet>
        </div>

        {/* Center: Logo (visible on all screens) */}
        <div className="flex-1 md:flex-none">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Store className="h-6 w-6" />
            <span className="hidden md:inline">WILD SOUL CLUB</span>
            <span className="md:hidden">WSC</span>
          </Link>
        </div>

        {/* Right: Desktop nav + cart + theme toggle */}
        <div className="flex items-center gap-2">
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {leftLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.icon && <link.icon className="h-4 w-4 mr-1 inline" />}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Cart button */}
          <Button variant="ghost" size="icon" aria-label="Cart" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute top-1 right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center">
                  {cartCount}
                </Badge>
              )}
            </Link>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Auth buttons */}
          {session ? <SignOutButton /> : <SignInButton />}
        </div>
      </div>

      {/* Mobile navigation sheet */}
      <SheetContent side="left">
        <div className="flex flex-col gap-4 pt-8">
          {mobileLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </SheetContent>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40">
          <div className="container mx-auto flex h-16 items-center px-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                className="text-lg"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
              className="ml-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}