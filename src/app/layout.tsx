import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
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
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-full flex flex-col font-sans">
          <Providers>{children}</Providers>
        </body>
      </html>
  );
}
