import Image from "next/image";
import Link from "next/link";
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

type Layout = readonly string[];

const mobileLayoutVariants: readonly Layout[] = [
  ["left-[7%] top-[10%] w-[52%]", "right-[7%] top-[58%] w-[47%]"],
  ["right-[7%] top-[12%] w-[49%]", "left-[8%] top-[57%] w-[53%]"],
  ["left-[15%] top-[9%] w-[47%]", "right-[10%] top-[60%] w-[51%]"],
  ["right-[12%] top-[8%] w-[52%]", "left-[5%] top-[61%] w-[45%]"],
  ["left-[5%] top-[17%] w-[48%]", "right-[13%] top-[54%] w-[52%]"],
  ["right-[5%] top-[19%] w-[46%]", "left-[12%] top-[62%] w-[50%]"],
];

const mobileSingleLayouts: readonly string[] = [
  "left-1/2 top-[46%] w-[64%] -translate-x-1/2 -translate-y-1/2",
  "left-1/2 top-[51%] w-[60%] -translate-x-1/2 -translate-y-1/2",
  "left-[14%] top-[38%] w-[62%]",
  "right-[10%] top-[43%] w-[58%]",
];

const desktopLayoutVariants: Readonly<Record<number, readonly Layout[]>> = {
  1: [
    ["left-1/2 top-1/2 w-[25%] -translate-x-1/2 -translate-y-1/2"],
    ["left-[18%] top-[31%] w-[24%]"],
    ["right-[17%] top-[38%] w-[23%]"],
  ],
  2: [
    ["left-[13%] top-[15%] w-[19%]", "right-[14%] top-[55%] w-[17%]"],
    ["right-[16%] top-[14%] w-[18%]", "left-[15%] top-[56%] w-[20%]"],
    ["left-[27%] top-[10%] w-[17%]", "right-[21%] top-[62%] w-[19%]"],
    ["right-[8%] top-[26%] w-[20%]", "left-[9%] top-[60%] w-[16%]"],
  ],
  3: [
    ["left-[10%] top-[14%] w-[18%]", "right-[12%] top-[24%] w-[15%]", "left-[42%] top-[60%] w-[19%]"],
    ["right-[12%] top-[12%] w-[17%]", "left-[13%] top-[34%] w-[19%]", "right-[35%] top-[63%] w-[16%]"],
    ["left-[24%] top-[8%] w-[16%]", "right-[8%] top-[42%] w-[19%]", "left-[8%] top-[66%] w-[17%]"],
    ["right-[27%] top-[9%] w-[19%]", "left-[7%] top-[39%] w-[16%]", "right-[12%] top-[68%] w-[18%]"],
  ],
  4: [
    ["left-[7%] top-[12%] w-[17%]", "right-[16%] top-[10%] w-[14%]", "left-[27%] top-[55%] w-[19%]", "right-[6%] top-[61%] w-[16%]"],
    ["right-[8%] top-[13%] w-[18%]", "left-[23%] top-[8%] w-[14%]", "right-[29%] top-[56%] w-[19%]", "left-[7%] top-[64%] w-[15%]"],
    ["left-[15%] top-[8%] w-[15%]", "right-[9%] top-[24%] w-[18%]", "left-[7%] top-[58%] w-[18%]", "right-[27%] top-[68%] w-[15%]"],
    ["right-[24%] top-[7%] w-[16%]", "left-[5%] top-[28%] w-[19%]", "right-[7%] top-[55%] w-[15%]", "left-[31%] top-[69%] w-[18%]"],
  ],
  5: [
    ["left-[5%] top-[12%] w-[17%]", "left-[38%] top-[8%] w-[14%]", "right-[8%] top-[20%] w-[16%]", "left-[22%] top-[58%] w-[19%]", "right-[25%] top-[63%] w-[15%]"],
    ["right-[6%] top-[10%] w-[17%]", "left-[25%] top-[8%] w-[15%]", "left-[7%] top-[38%] w-[18%]", "right-[29%] top-[50%] w-[14%]", "right-[8%] top-[67%] w-[17%]"],
    ["left-[7%] top-[16%] w-[16%]", "right-[30%] top-[7%] w-[18%]", "right-[6%] top-[36%] w-[14%]", "left-[29%] top-[48%] w-[19%]", "right-[30%] top-[70%] w-[15%]"],
    ["left-[12%] top-[7%] w-[15%]", "right-[34%] top-[13%] w-[17%]", "right-[7%] top-[30%] w-[18%]", "left-[6%] top-[59%] w-[17%]", "right-[22%] top-[68%] w-[16%]"],
    ["right-[9%] top-[8%] w-[16%]", "left-[34%] top-[18%] w-[18%]", "left-[7%] top-[35%] w-[15%]", "right-[35%] top-[57%] w-[17%]", "right-[7%] top-[69%] w-[18%]"],
  ],
};

export const MOBILE_FLOATING_PRODUCTS_PER_CANVAS = 2;
export const DESKTOP_FLOATING_PRODUCTS_PER_CANVAS = 5;

export function chunkFloatingProducts<T>(items: T[], productsPerCanvas: number) {
  return Array.from({ length: Math.ceil(items.length / productsPerCanvas) }, (_, index) =>
    items.slice(index * productsPerCanvas, (index + 1) * productsPerCanvas),
  );
}

function layoutFor(viewport: "mobile" | "desktop", count: number, groupIndex: number) {
  if (viewport === "mobile") {
    if (count === 1) return [mobileSingleLayouts[groupIndex % mobileSingleLayouts.length]];
    return mobileLayoutVariants[groupIndex % mobileLayoutVariants.length];
  }

  const variants = desktopLayoutVariants[count] ?? desktopLayoutVariants[5];
  return variants[groupIndex % variants.length];
}

export function FloatingProductCanvas({
  products,
  groupIndex = 0,
  fullViewport = false,
  compactSparse = false,
  viewport = "desktop",
}: {
  products: FloatingProduct[];
  groupIndex?: number;
  fullViewport?: boolean;
  compactSparse?: boolean;
  viewport?: "mobile" | "desktop";
}) {
  const layout = layoutFor(viewport, products.length, groupIndex);

  return (
    <div
      className={`${styles.canvas} ${viewport === "mobile" ? styles.mobileCanvas : styles.desktopCanvas}`}
      data-full-viewport={fullViewport || undefined}
      data-compact-sparse={compactSparse || undefined}
    >
      {products.map((product, index) => {
        const productImage = product.product_images?.[0];
        const image = productImage?.transparent_url || product.thumbnail_url || productImage?.url || productImage?.image_url || productImage?.object_key || PLACEHOLDER;
        const soldOut = product.stock != null && Number(product.stock) <= 0;
        const productVisual = (
          <div className="relative aspect-square w-full">
            <Image src={image} alt={product.name} fill unoptimized sizes={viewport === "mobile" ? "(max-width: 767px) 64vw, 1px" : "(min-width: 768px) 25vw, 1px"} placeholder="blur" blurDataURL={PLACEHOLDER} preload={groupIndex === 0 && index === 0} className={productImage?.transparent_url ? "rounded-lg object-contain drop-shadow-[0_22px_25px_rgba(0,0,0,0.13)]" : "rounded-lg object-cover"} />
            {soldOut && <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-black/65 opacity-0 backdrop-blur-xl transition-opacity duration-300 ease-in-out group-hover:opacity-100 motion-reduce:transition-none">Sold out</span>}
          </div>
        );
        return (
          <div key={product.id} className={`absolute ${layout[index]}`} style={{ zIndex: 10 + (index % 4) }}>
            <div className={`${styles.floatingProduct} ${soldOut ? styles.soldOut : ""}`}>
              {soldOut ? (
                <div className="group relative block cursor-not-allowed rounded-lg" aria-label={`${product.name} is sold out`}>
                  {productVisual}
                </div>
              ) : (
                <Link href={`/products/${product.slug || product.id}`} aria-label={`View ${product.name}`} prefetch={groupIndex === 0 ? null : false} className="group relative block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                  {productVisual}
                {/* <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-max max-w-[190px] -translate-x-1/2 rounded-2xl border border-black/[0.06] bg-white/85 px-4 py-3 text-center opacity-0 shadow-xl backdrop-blur-2xl transition-opacity duration-300 ease-in-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
                  <p className="line-clamp-1 text-xs font-medium">{product.name}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{product.categories?.name || product.category || "Wild Soul"}</p>
                  <div className="mt-2 flex justify-center gap-2 text-[11px] font-semibold"><span>{formatPrice(product.sale_price || product.price)}</span>{product.sale_price && <span className="text-muted-foreground line-through">{formatPrice(product.price)}</span>}</div>
                  <ArrowUpRight className="mx-auto mt-2 h-3.5 w-3.5 text-muted-foreground" />
                </div> */}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ResponsiveFloatingProductCanvases({ products, fullViewport = false, compactSparse = false }: { products: FloatingProduct[]; fullViewport?: boolean; compactSparse?: boolean }) {
  const mobileGroups = chunkFloatingProducts(products, MOBILE_FLOATING_PRODUCTS_PER_CANVAS);
  const desktopGroups = chunkFloatingProducts(products, DESKTOP_FLOATING_PRODUCTS_PER_CANVAS);

  return (
    <>
      <div className={styles.mobileGroups}>
        {mobileGroups.map((group, index) => <FloatingProductCanvas key={`mobile-${index}`} products={group} groupIndex={index} fullViewport={fullViewport} compactSparse={compactSparse} viewport="mobile" />)}
      </div>
      <div className={styles.desktopGroups}>
        {desktopGroups.map((group, index) => <FloatingProductCanvas key={`desktop-${index}`} products={group} groupIndex={index} fullViewport={fullViewport} compactSparse={compactSparse} viewport="desktop" />)}
      </div>
    </>
  );
}

function SkeletonCanvas({ viewport }: { viewport: "mobile" | "desktop" }) {
  const layout = layoutFor(viewport, viewport === "mobile" ? 2 : 5, 0);
  return <div className={`${styles.canvas} ${viewport === "mobile" ? styles.mobileCanvas : styles.desktopCanvas}`} aria-label="Loading products">{layout.map((position) => <div key={position} className={`absolute ${position}`}><div className="aspect-square animate-pulse rounded-lg bg-black/[0.055] motion-reduce:animate-none" /></div>)}</div>;
}

export function FloatingProductSkeleton() {
  return <><div className={styles.mobileGroups}><SkeletonCanvas viewport="mobile" /></div><div className={styles.desktopGroups}><SkeletonCanvas viewport="desktop" /></div></>;
}
