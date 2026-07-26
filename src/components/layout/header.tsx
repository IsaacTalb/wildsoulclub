"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { SignInButton, UserButton } from "@/components/authButtons";
import { ChevronDown, Menu, ShoppingCart, Search, User, Sun, Moon, LogOut, UserCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useCart } from "@/hooks/use-cart";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Drop } from "@/types/product";

const leftLinks = [
  { href: "/products", label: "Shop" },
  { href: "/archive-sales", label: "Archive Sale" },
  { href: "/about", label: "About Us" },
];

const mobileLinks = [
  { href: "/products", label: "Shop" },
  { href: "/new-drops", label: "New Drop" },
  { href: "/archive-sales", label: "Archive Sale" },
  { href: "/about", label: "About Us" },
  { href: "/collections", label: "Collections" },
];

type DropsState =
  | { status: "loading"; drops: Drop[] }
  | { status: "success"; drops: Drop[] }
  | { status: "failure"; drops: Drop[] };

function useNewDrops() {
  const [state, setState] = useState<DropsState>({ status: "loading", drops: [] });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/new-drops", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to fetch drops");
        const payload: unknown = await response.json();
        const drops =
          typeof payload === "object" && payload !== null && "data" in payload && Array.isArray(payload.data)
            ? (payload.data as Drop[])
            : [];
        setState({ status: "success", drops });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "failure", drops: [] });
      });

    return () => controller.abort();
  }, []);

  return state;
}

function DropLinks({
  state,
  onSelect,
  mobile = false,
}: {
  state: DropsState;
  onSelect?: () => void;
  mobile?: boolean;
}) {
  const linkClassName = mobile
    ? "flex min-h-11 items-center rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    : "w-full cursor-pointer px-3 py-2";

  if (state.status === "loading") {
    const message = <span role="status">Loading drops…</span>;
    return mobile ? (
      <p className="px-3 py-3 text-sm text-muted-foreground">{message}</p>
    ) : (
      <DropdownMenuItem disabled className="px-3 py-2 text-muted-foreground">{message}</DropdownMenuItem>
    );
  }
  if (state.status === "failure") {
    const message = <span role="alert">Drops couldn&apos;t be loaded.</span>;
    return mobile ? (
      <p className="px-3 py-3 text-sm text-destructive">{message}</p>
    ) : (
      <DropdownMenuItem disabled className="px-3 py-2 text-destructive">{message}</DropdownMenuItem>
    );
  }

  return (
    <>
      {state.drops.length === 0 && (
        mobile ? (
          <p className="px-3 py-3 text-sm text-muted-foreground">No active or scheduled drops.</p>
        ) : (
          <DropdownMenuItem disabled className="px-3 py-2 text-muted-foreground">
            No active or scheduled drops.
          </DropdownMenuItem>
        )
      )}
      {state.drops.map((drop) => mobile ? (
        <Link key={drop.id} href={`/new-drops/${drop.slug}`} className={linkClassName} onClick={onSelect}>
          {drop.name}
        </Link>
      ) : (
        <DropdownMenuItem key={drop.id} render={<Link href={`/new-drops/${drop.slug}`} />} className={linkClassName}>
          {drop.name}
        </DropdownMenuItem>
      ))}
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileDropsOpen, setMobileDropsOpen] = useState(false);
  const [desktopDropsOpen, setDesktopDropsOpen] = useState(false);
  const dropsState = useNewDrops();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  const submitSearch = (formData: FormData) => {
    const query = String(formData.get("search") ?? "").trim();
    if (!query) return;
    setIsOpen(false);
    setSearchOpen(false);
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full px-2 pt-2 sm:px-3">
      <div className="liquid-pill container relative mx-auto grid h-16 grid-cols-[1fr_auto_1fr] items-center px-2.5 shadow-lg sm:px-4 xl:flex xl:justify-between">
        {/* Mobile navigation */}
        <div className="flex min-w-0 items-center justify-self-start xl:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto px-4">
              <div className="mt-8 flex flex-col gap-1">
                <form action={submitSearch} className="relative z-10 mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input name="search" aria-label="Search products" placeholder="Search products..." className="liquid-pill h-11 pl-10 pr-16" />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary">Go</button>
                </form>
                {mobileLinks.map((link) => link.href === "/new-drops" ? (
                  <div key={link.href}>
                    <button
                      type="button"
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-base font-medium transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        pathname.startsWith("/new-drops") ? "bg-muted text-foreground" : "text-muted-foreground"
                      )}
                      aria-expanded={mobileDropsOpen}
                      aria-controls="mobile-new-drops-menu"
                      onClick={() => setMobileDropsOpen((open) => !open)}
                    >
                      New Drop
                      <ChevronDown className={cn("h-4 w-4 transition-transform", mobileDropsOpen && "rotate-180")} />
                    </button>
                    {mobileDropsOpen && (
                      <div id="mobile-new-drops-menu" role="region" aria-label="New drops" className="ml-3 max-h-64 overflow-y-auto border-l pl-2">
                        <DropLinks state={dropsState} mobile onSelect={() => setIsOpen(false)} />
                        <Link href="/new-drops" className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setIsOpen(false)}>
                          View all drops
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
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

        </div>

        {/* Left: Desktop nav links */}
        <nav className="hidden xl:flex items-center gap-1">
          {leftLinks.slice(0, 1).map((link) => (
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
          <DropdownMenu open={desktopDropsOpen} onOpenChange={setDesktopDropsOpen} modal={false}>
            <DropdownMenuTrigger
              openOnHover
              closeDelay={150}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pathname.startsWith("/new-drops") ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
              aria-expanded={desktopDropsOpen}
              aria-label="New Drop menu"
            >
              New Drop
              <ChevronDown className={cn("h-4 w-4 transition-transform", desktopDropsOpen && "rotate-180")} />
            </DropdownMenuTrigger>
            <DropdownMenuContent aria-label="New drops" className="max-h-80 w-[min(20rem,calc(100vw-2rem))] overflow-y-auto">
              <DropLinks state={dropsState} />
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/new-drops" />} className="w-full cursor-pointer px-3 py-2 font-medium">
                View all drops
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {leftLinks.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary hover:bg-muted",
                pathname === link.href ? "text-foreground bg-muted" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Center: Logo */}
        <Link href="/" className="relative z-10 col-start-2 flex min-w-0 items-center justify-self-center xl:absolute xl:left-1/2 xl:-translate-x-1/2">
          <span className="truncate text-base font-bold tracking-tight sm:text-xl">
            wildsoulclub@
          </span>
        </Link>

        {/* Right Actions */}
        <div className="relative z-10 flex min-w-0 items-center justify-self-end gap-0.5 sm:gap-1">
          {/* Search - Desktop only */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle color theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Auth - Desktop */}
          <div className="hidden xl:block">
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

          {/* Cart */}
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="liquid-pill relative h-10 w-10 border-0" aria-label={`Cart with ${cartCount} ${cartCount === 1 ? "item" : "items"}`}>
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
        <div className="container mx-auto mt-2 rounded-[1.35rem] border px-4 py-3 bg-background/80 backdrop-blur-xl">
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
