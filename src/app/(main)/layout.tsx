export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartHydration } from "@/components/cart-hydration";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CartHydration />
      <Header />
      <main className="flex-1 relative">{children}</main>
      {/* <Footer /> */}
    </>
  );
}
