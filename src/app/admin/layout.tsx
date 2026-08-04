"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  Tag,
  Truck,
  Image,
  Sliders,
  Settings,
  FileText,
  Shield,
  BarChart3,
  Menu,
  X,
  Bell,
  Search,
  MapPin,
  Percent,
  Layers,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "New Drops",
    href: "/admin/new-drops",
    icon: Package,
  },
  {
    title: "Collections",
    href: "/admin/collections",
    icon: Layers,
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: Tag,
  },
  {
    title: "Inventory",
    href: "/admin/inventory",
    icon: ShoppingBag,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Coupons",
    href: "/admin/coupons",
    icon: Percent,
  },
  {
    title: "Delivery Fee",
    href: "/admin/delivery-fee",
    icon: Truck,
  },
  {
    title: "Townships",
    href: "/admin/townships",
    icon: MapPin,
  },
  {
    title: "Banners",
    href: "/admin/banners",
    icon: Image,
  },
  {
    title: "Hero Slider",
    href: "/admin/hero-slider",
    icon: Sliders,
  },
  {
    title: "Website Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Pages",
    href: "/admin/pages",
    icon: FileText,
  },
  {
    title: "Admins",
    href: "/admin/admins",
    icon: Shield,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
];

const ADMIN_CACHE_KEY = "wsc-admin-access";
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000;

type AdminAccessCache = { userId: string; verifiedAt: number };

function readAdminAccessCache(): AdminAccessCache | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = JSON.parse(sessionStorage.getItem(ADMIN_CACHE_KEY) ?? "null") as AdminAccessCache | null;
    if (!cached?.userId || Date.now() - cached.verifiedAt > ADMIN_CACHE_TTL_MS) {
      sessionStorage.removeItem(ADMIN_CACHE_KEY);
      return null;
    }
    return cached;
  } catch {
    sessionStorage.removeItem(ADMIN_CACHE_KEY);
    return null;
  }
}

function clearAdminAccessCache() {
  if (typeof window !== "undefined") sessionStorage.removeItem(ADMIN_CACHE_KEY);
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(() => !readAdminAccessCache());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // The cache only avoids a blocking loading screen. It never authorizes admin
  // data: every /api/admin request independently enforces requireAdmin().
  useEffect(() => {
    let active = true;

    const verifyAdmin = async (blockWhileChecking = true, knownSession?: Session | null) => {
      if (blockWhileChecking) setCheckingAccess(true);
      const session = knownSession === undefined
        ? (await supabase.auth.getSession()).data.session
        : knownSession;

      if (!session) {
        clearAdminAccessCache();
        router.replace(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      const cached = readAdminAccessCache();
      const hasVerifiedCache = cached?.userId === session.user.id;
      if (hasVerifiedCache && active) setCheckingAccess(false);

      const response = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });

      if (!response.ok) {
        clearAdminAccessCache();
        router.replace("/");
        return;
      }

      sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({ userId: session.user.id, verifiedAt: Date.now() } satisfies AdminAccessCache));
      if (active) setCheckingAccess(false);
    };

    const cached = readAdminAccessCache();
    void verifyAdmin(!cached);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          clearAdminAccessCache();
          router.replace(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
          return;
        }

        const verified = readAdminAccessCache();
        if (event === "SIGNED_IN" && verified?.userId !== session.user.id) {
          clearAdminAccessCache();
          void verifyAdmin(true, session);
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-muted-foreground">
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <Link href="/admin/dashboard" className="font-bold text-lg">
            WSC<span className="text-primary">Admin</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 h-[calc(100vh-3.5rem)]">
          <nav className="p-2 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.title}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-white/90 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b bg-white flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 h-9 w-64" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                3
              </Badge>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
              >
                <User className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href="/profile" className="flex w-full items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/admin/settings" className="flex w-full items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 w-full text-left">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
