import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTiktok, FaTelegram } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-tight">
              WILD SOUL CLUB
            </Link>

            <p className="mt-3 text-sm text-muted-foreground">
              Myanmar streetwear brand inspired by the wild spirit.
              Express your soul through our unique designs.
            </p>

            <div className="mt-4 flex items-center gap-4">
              {/* Facebook */}
              <a
                href="https://www.facebook.com/profile.php?id=100092032210545"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Wild Soul Club Facebook"
                className="text-black transition-opacity hover:opacity-60"
              >
                <FaFacebookF className="h-5 w-5" />
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/wild_soul_club"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Wild Soul Club Instagram"
                className="text-black transition-opacity hover:opacity-60"
              >
                <FaInstagram className="h-5 w-5" />
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@wild.soul.club"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Wild Soul Club TikTok"
                className="text-black transition-opacity hover:opacity-60"
              >
                <FaTiktok className="h-5 w-5" />
              </a>

              {/* Telegram */}
              <a
                href="https://t.me/wildsoulclubofficial"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Wild Soul Club Telegram"
                className="text-black transition-opacity hover:opacity-60"
              >
                <FaTelegram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="/new-drops" className="hover:text-primary transition-colors">Collections</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-3">Customer Service</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/delivery" className="hover:text-primary transition-colors">Delivery Information</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-3">Contact Us</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>wildsoulclubofficial@gmail.com</li>
              <li>09767676114</li>
              <li>Pannita Street, Hlaing Township, Yangon</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-muted-foreground text-center">
          <p>
            &copy; {new Date().getFullYear()} Wild Soul Club. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
