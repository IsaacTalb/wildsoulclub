import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import styles from "./floating-product-canvas.module.css";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 25'%3E%3Crect width='20' height='25' fill='%23f5f5f5'/%3E%3Ccircle cx='10' cy='12.5' r='6' fill='%23e5e7eb'/%3E%3C/svg%3E";

export interface FloatingProduct {
  id: string;
  name: string;
  slug?: string | null;
  price: number;
  sale_price?: number | null;
  stock?: number | null;
  thumbnail_url?: string | null;
  product_images?: Array<{ url?: string | null; image_url?: string | null; object_key?: string | null; transparent_url?: string | null }> | null;
  category?: string | null;
  categories?: { name?: string | null } | null;
  is_active?: boolean;
  is_archived?: boolean;
  is_new_drop?: boolean;
}

const layouts = [
  "left-[3%] top-[5%] w-[39%] md:left-[5%] md:top-[9%] md:w-[17%]",
  "right-[5%] top-[2%] w-[31%] md:left-[34%] md:right-auto md:w-[13%]",
  "left-[29%] top-[30%] w-[42%] md:left-[43%] md:top-[27%] md:w-[18%]",
  "right-[3%] top-[21%] w-[27%] md:right-[8%] md:top-[12%] md:w-[13%]",
  "left-[4%] top-[57%] w-[29%] md:left-[8%] md:top-[55%] md:w-[12%]",
  "right-[6%] top-[52%] w-[36%] md:right-[18%] md:top-[45%] md:w-[16%]",
  "right-[-2%] top-[77%] w-[32%] md:top-[75%] md:w-[15%]",
  "left-[29%] top-[80%] w-[30%] md:left-[27%] md:top-[72%] md:w-[14%]",
] as const;

export const FLOATING_PRODUCTS_PER_CANVAS = 8;

export function chunkFloatingProducts<T>(items: T[]) {
  return Array.from({ length: Math.ceil(items.length / FLOATING_PRODUCTS_PER_CANVAS) }, (_, index) =>
    items.slice(index * FLOATING_PRODUCTS_PER_CANVAS, (index + 1) * FLOATING_PRODUCTS_PER_CANVAS),
  );
}

function statusFor(product: FloatingProduct) {
  if (product.is_archived) return "Archive";
  if (product.is_active === false) return "Unavailable";
  if (product.stock != null && Number(product.stock) <= 0) return "Sold out";
  if (product.sale_price) return "Sale";
  if (product.is_new_drop) return "New";
  return null;
}

export function FloatingProductCanvas({ products, groupIndex = 0 }: { products: FloatingProduct[]; groupIndex?: number }) {
  return (
    <div className="relative h-[900px] w-full sm:h-[960px] md:h-[760px] lg:h-[820px]">
      {products.map((product, index) => {
        const single = products.length === 1;
        const productImage = product.product_images?.[0];
        const image = productImage?.transparent_url || product.thumbnail_url || productImage?.url || productImage?.image_url || productImage?.object_key || PLACEHOLDER;
        const status = statusFor(product);
        return (
          <div key={product.id} className={`absolute ${single ? "left-1/2 top-1/2 w-[65%] -translate-x-1/2 -translate-y-1/2 md:w-[24%]" : layouts[index]}`} style={{ zIndex: 10 + (index % 4) }}>
            <div className={styles.floatingProduct}>
              <Link href={`/products/${product.slug || product.id}`} aria-label={`View ${product.name}`} prefetch={groupIndex === 0 ? null : false} className="group relative block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                <div className="relative aspect-square w-full">
                  <Image src={image} alt={product.name} fill unoptimized sizes="(min-width: 768px) 20vw, 42vw" placeholder="blur" blurDataURL={PLACEHOLDER} preload={groupIndex === 0 && index === 0} className={productImage?.transparent_url ? "rounded-lg object-contain drop-shadow-[0_22px_25px_rgba(0,0,0,0.13)]" : "rounded-lg object-cover"} />
                  {status && <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-black/65 opacity-0 backdrop-blur-xl transition-opacity duration-300 ease-in-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">{status}</span>}
                </div>
                <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-max max-w-[190px] -translate-x-1/2 rounded-2xl border border-black/[0.06] bg-white/85 px-4 py-3 text-center opacity-0 shadow-xl backdrop-blur-2xl transition-opacity duration-300 ease-in-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
                  <p className="line-clamp-1 text-xs font-medium">{product.name}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{product.categories?.name || product.category || "Wild Soul"}</p>
                  <div className="mt-2 flex justify-center gap-2 text-[11px] font-semibold"><span>{formatPrice(product.sale_price || product.price)}</span>{product.sale_price && <span className="text-muted-foreground line-through">{formatPrice(product.price)}</span>}</div>
                  <ArrowUpRight className="mx-auto mt-2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FloatingProductSkeleton() {
  return <div className="relative h-[900px] w-full sm:h-[960px] md:h-[760px] lg:h-[820px]" aria-label="Loading products">{layouts.map((layout) => <div key={layout} className={`absolute ${layout}`}><div className="aspect-square animate-pulse rounded-lg bg-black/[0.055] motion-reduce:animate-none" /></div>)}</div>;
}
