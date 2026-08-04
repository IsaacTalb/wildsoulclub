import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

const helvetica = localFont({
  src: [
    {
      path: "../../public/fonts/helvetica-255-webfont/helvetica-light-587ebe5a59211.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/helvetica-255-webfont/Helvetica.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/helvetica-255-webfont/Helvetica-Oblique.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/helvetica-255-webfont/Helvetica-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/helvetica-255-webfont/Helvetica-BoldOblique.woff",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-helvetica",
  display: "swap",
});

const helveticaCompressed = localFont({
  src: "../../public/fonts/helvetica-255-webfont/helvetica-compressed-5871d14b6903a.woff",
  variable: "--font-helvetica-compressed",
  display: "swap",
});

const helveticaRounded = localFont({
  src: "../../public/fonts/helvetica-255-webfont/helvetica-rounded-bold-5871d05ead8de.woff",
  variable: "--font-helvetica-rounded",
  display: "swap",
});

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase,
  icons: {
    icon: "/images/logo-black.png",
    shortcut: "/images/logo-black.png",
  },
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
        url: "/images/logo-white.png",
        alt: "Wild Soul Club",
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
    <html
      lang="en"
      className={`${helvetica.variable} ${helveticaCompressed.variable} ${helveticaRounded.variable}`}
    >
      <body className="flex min-h-full flex-col bg-white text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
