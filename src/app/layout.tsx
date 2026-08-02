import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

const helvetica = localFont({
  src: [
    { path: "../../public/fonts/helvetica-255/Helvetica.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/helvetica-255/helvetica-light-587ebe5a59211.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/helvetica-255/Helvetica-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/helvetica-255/Helvetica-Oblique.ttf", weight: "400", style: "italic" },
  ],
  variable: "--font-helvetica",
  display: "swap",
});

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Wild Soul Club - Myanmar Streetwear Brand",
    template: "%s | Wild Soul Club",
  },
  description:
    "Premium streetwear clothing brand from Myanmar. Shop the latest collections of t-shirts, hoodies, and more.",
  keywords: [
    "wild soul club",
    "myanmar streetwear",
    "clothing brand myanmar",
    "streetwear myanmar",
  ],
  openGraph: {
    title: "Wild Soul Club",
    description: "Myanmar Streetwear Brand",
    type: "website",
    locale: "en_US",
    siteName: "Wild Soul Club",
    images: [
      {
        url: "/images/wsc-logo.svg",
        alt: "Wild Soul Club logo",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" className={helvetica.variable}>
        <body className="flex min-h-full flex-col bg-white font-sans text-foreground">
          <Providers>{children}</Providers>
        </body>
      </html>
  );
}
