"use client";

import Link from "next/link";
import Image from 'next/image';
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { SignInButton, UserButton } from "@/components/authButtons";
import {
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  UserCircle,
  UserPlus,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const leftLinks = [
  { href: "/products", label: "Shop" },
  { href: "/archive-sales", label: "Archive Sale" },
  { href: "/about", label: "About Us" },
];

const mobileLinks = [
  { href: "/new-drops", label: "New Drop" },
  { href: "/archive-sales", label: "Archive Sale" },
  { href: "/about", label: "About Us" },
  { href: "/collections", label: "Collections" },
];

type Category = { id: string; name: string };

export function Header() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session),
    );

    return () => subscription.unsubscribe();
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/public/categories", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to fetch categories");
        const payload: unknown = await response.json();
        const data =
          typeof payload === "object" &&
          payload !== null &&
          "data" in payload &&
          Array.isArray(payload.data)
            ? payload.data
            : [];
        setCategories(
          data.filter(
            (category): category is Category =>
              typeof category === "object" &&
              category !== null &&
              typeof category.id === "string" &&
              typeof category.name === "string",
          ),
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setCategories([]);
      });

    return () => controller.abort();
  }, []);
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.refresh();
  };

  const submitSearch = (formData: FormData) => {
    const query = String(formData.get("search") ?? "").trim();
    if (!query) return;
    setIsOpen(false);
    setSearchOpen(false);
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

  return (
    <header
      className={cn(
        "top-0 z-50 h-[var(--site-header-height)] w-full px-0 pt-[max(0.25rem,env(safe-area-inset-top))] sm:px-0",
        isHomepage ? "fixed text-white" : "sticky",
      )}
    >
      <div
        className={cn(
          "liquid-pill relative grid h-13 w-full max-w-none grid-cols-[1fr_auto_1fr] items-center px-2.5 shadow-lg sm:px-4 xl:flex xl:justify-between",
          isHomepage &&
            "!border-white/30 !bg-black/35 !text-white shadow-[0_12px_40px_rgba(0,0,0,0.28)] [&_a]:!text-white [&_button]:!text-white",
        )}
      >
        {/* Mobile navigation */}
        <div className="relative z-20 flex min-w-0 items-center justify-self-start xl:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 shrink-0 rounded-full"
                aria-label="Open navigation menu"
                aria-expanded={isOpen}
                aria-controls="mobile-navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              id="mobile-navigation"
              side="left"
              showCloseButton={false}
              className="!fixed !inset-y-0 !left-0 !right-auto !top-0 !bottom-0 !z-[100] !m-0 flex !h-dvh !max-h-dvh !translate-y-0 w-[min(22rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-r-[2rem] border-r bg-background/95 p-0 shadow-2xl backdrop-blur-2xl duration-300"
            >
              <div className="flex shrink-0 justify-end px-2 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))]">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close navigation menu"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
                <form
                  action={submitSearch}
                  className="relative z-10 mb-4 w-full"
                >
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="search"
                    aria-label="Search products"
                    placeholder="Search products..."
                    className="liquid-pill h-11 w-full pl-10 pr-12"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-xl text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Submit product search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>

                <nav
                  className="flex flex-col gap-1"
                  aria-label="Mobile navigation"
                >
                  <div>
                    <button
                      type="button"
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-base font-medium transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        pathname === "/products"
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground",
                      )}
                      aria-expanded={mobileShopOpen}
                      aria-controls="mobile-shop-menu"
                      onClick={() => setMobileShopOpen((open) => !open)}
                    >
                      Shop
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-300",
                          mobileShopOpen && "rotate-180",
                        )}
                      />
                    </button>
                    <div
                      id="mobile-shop-menu"
                      className={cn(
                        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                        mobileShopOpen
                          ? "grid-rows-[1fr] opacity-100"
                          : "pointer-events-none grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div
                          role="region"
                          aria-label="Shop categories"
                          className="ml-3 border-l pl-2"
                        >
                          <Link
                            href="/products"
                            className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-muted"
                            onClick={() => setIsOpen(false)}
                          >
                            Shop all
                          </Link>
                          {categories.map((category) => (
                            <Link
                              key={category.id}
                              href={`/products?category=${encodeURIComponent(category.id)}`}
                              className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                              onClick={() => setIsOpen(false)}
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {mobileLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted hover:text-primary",
                        pathname === link.href
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground",
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="shrink-0 border-t border-border/60 bg-background/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
                {session ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                      <UserButton />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {session.user.user_metadata?.full_name ||
                            session.user.email?.split("@")[0] ||
                            "User"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" asChild className="rounded-xl">
                        <Link href="/profile" onClick={() => setIsOpen(false)}>
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" asChild className="rounded-xl">
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Log in
                      </Link>
                    </Button>
                    <Button asChild className="rounded-xl">
                      <Link href="/signup" onClick={() => setIsOpen(false)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Sign up
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Left: Desktop nav links */}
        <nav className="hidden xl:flex items-center gap-1">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              openOnHover
              closeDelay={150}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pathname === "/products"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
              aria-label="Shop menu"
            >
              Shop
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              aria-label="Shop categories"
              className="max-h-80 w-[min(20rem,calc(100vw-2rem))] overflow-y-auto"
            >
              <DropdownMenuItem
                render={<Link href="/products" />}
                className="w-full cursor-pointer px-3 py-2 font-medium"
              >
                Shop all
              </DropdownMenuItem>
              {categories.length > 0 && <DropdownMenuSeparator />}
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  render={
                    <Link
                      href={`/products?category=${encodeURIComponent(category.id)}`}
                    />
                  }
                  className="w-full cursor-pointer px-3 py-2"
                >
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href="/new-drops"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary",
              pathname.startsWith("/new-drops")
                ? "bg-muted text-foreground"
                : "text-muted-foreground",
            )}
          >
            New Drop
          </Link>
          {leftLinks.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary hover:bg-muted",
                pathname === link.href
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Center: Logo */}
        <Link
          href="/"
          className="relative z-10 col-start-2 flex min-w-0 items-center justify-self-center xl:absolute xl:left-1/2 xl:-translate-x-1/2"
        >
          <Image
            src="/images/wsc-logo.svg"
            alt="Wild Soul Club"
            width={40}          // adjust to your desired size
            height={40}         // adjust to your desired size
            className="object-contain"
            priority            // optional, if this is above the fold
          />
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

          {/* Auth - Desktop */}
          <div className="hidden xl:block">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                  <UserCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {session.user.user_metadata?.full_name ||
                      session.user.email?.split("@")[0] ||
                      "User"}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Link
                      href="/profile"
                      className="flex w-full items-center gap-2 cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <button
                      onClick={() => supabase.auth.signOut()}
                      className="flex items-center gap-2 w-full text-left"
                    >
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
            <Button
              variant="ghost"
              size="icon"
              className="liquid-pill relative h-10 w-10 border-0"
              aria-label={`Cart with ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            >
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
