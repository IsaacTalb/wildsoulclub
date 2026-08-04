export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { CartHydration } from "@/components/cart-hydration";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col font-sans [--site-header-height:calc(4rem+max(0.25rem,env(safe-area-inset-top)))]">
      <CartHydration />
      <Header />
      <main className="flex-1 relative">{children}</main>
    </div>
  );
}
