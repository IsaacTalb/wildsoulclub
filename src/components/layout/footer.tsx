import Link from "next/link";
import { Globe, Camera, MessageCircle, Send, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-bold tracking-tight">
              WILD<span className="text-primary">SOUL</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Myanmar streetwear brand inspired by the wild spirit. 
              Express your soul through our unique designs.
            </p>
            <div className="flex gap-3 mt-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Camera className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Send className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="/collections" className="hover:text-primary transition-colors">Collections</Link></li>
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
              <li>hello@wildsoulclub.com</li>
              <li>09-123456789</li>
              <li>Yangon, Myanmar</li>
            </ul>
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Payment Methods</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-muted rounded">KBZPay</span>
                <span className="px-2 py-1 bg-muted rounded">Wave</span>
                <span className="px-2 py-1 bg-muted rounded">AYA Pay</span>
                <span className="px-2 py-1 bg-muted rounded">CB Pay</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Wild Soul Club. All rights reserved.
          </p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-red-500" /> in Myanmar
          </p>
        </div>
      </div>
    </footer>
  );
}
