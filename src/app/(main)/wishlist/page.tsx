"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useWishlist } from "@/hooks/use-wishlist";

export default function WishlistPage() {
  const { items, hasHydrated, removeItem } = useWishlist();

  if (!hasHydrated) {
    return (
      <div className="container mx-auto min-h-[50vh] px-4 py-16 text-center text-muted-foreground" role="status">
        Loading your wishlist…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <Heart className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">Your Wishlist is Empty</h1>
          <p className="mb-8 text-muted-foreground">Save the pieces you love and find them here later.</p>
          <Link href="/products">
            <Button size="lg">
              <ArrowLeft className="mr-2 h-5 w-5" /> Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">My Wishlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} {items.length === 1 ? "item" : "items"} saved</p>
        </div>
        <Link href="/products"><Button variant="outline">Continue Shopping</Button></Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <article key={item.id} className="group overflow-hidden rounded-2xl border bg-card">
            <Link href={`/products/${item.slug || item.id}`} className="block">
              <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                {item.thumbnailUrl ? (
                  <Image src={item.thumbnailUrl} alt={item.name} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
                )}
              </div>
            </Link>
            <div className="p-3">
              <Link href={`/products/${item.slug || item.id}`} className="line-clamp-1 font-medium hover:text-primary">{item.name}</Link>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="font-semibold">{formatPrice(item.salePrice ?? item.price)}</p>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name} from wishlist`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
