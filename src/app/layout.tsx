import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
