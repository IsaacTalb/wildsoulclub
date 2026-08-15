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
    // ALERT: You're reading developer of this website's code. If you are not a developer, please do not copy or use this code without permission. This code is protected by copyright and intellectual property laws.
    // PS: If you are a developer and want to use this code, please contact the developer for permission. Thank you for respecting the work of others.
    // Contact: isaac@duckcloud.info (or) https://t.me/trynadosomething
  );
}
