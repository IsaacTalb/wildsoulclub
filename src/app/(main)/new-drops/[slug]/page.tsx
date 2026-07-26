import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicDropBySlug } from "@/lib/server/drops";
import { formatPrice } from "@/lib/utils";

import styles from "./floating-products.module.css";

const floatingProductLayouts = [
  {
    position:
      "left-[1%] top-[3%] w-[42%] sm:left-[5%] sm:w-[36%] md:left-[3%] md:top-[8%] md:w-[18%]",
    rotation: "-4deg",
    delay: "-1.2s",
    duration: "8.5s",
  },
  {
    position:
      "right-[1%] top-[11%] w-[35%] sm:right-[7%] sm:w-[32%] md:left-[25%] md:right-auto md:top-[2%] md:w-[16%]",
    rotation: "3deg",
    delay: "-3.6s",
    duration: "9.2s",
  },
  {
    position:
      "left-[10%] top-[28%] w-[33%] sm:left-[16%] md:left-[47%] md:top-[15%] md:w-[20%]",
    rotation: "2deg",
    delay: "-5.1s",
    duration: "10s",
  },
  {
    position:
      "right-[2%] top-[38%] w-[43%] sm:right-[8%] sm:w-[38%] md:right-[3%] md:top-[4%] md:w-[18%]",
    rotation: "-3deg",
    delay: "-2.4s",
    duration: "8.8s",
  },
  {
    position:
      "left-[1%] top-[55%] w-[38%] sm:left-[7%] sm:w-[34%] md:left-[9%] md:top-[55%] md:w-[20%]",
    rotation: "4deg",
    delay: "-6.2s",
    duration: "9.7s",
  },
  {
    position:
      "right-[12%] top-[63%] w-[34%] sm:right-[17%] sm:w-[30%] md:left-[36%] md:right-auto md:top-[57%] md:w-[17%]",
    rotation: "-2deg",
    delay: "-4.3s",
    duration: "8.3s",
  },
  {
    position:
      "left-[13%] top-[77%] w-[42%] sm:left-[18%] sm:w-[36%] md:left-[57%] md:top-[61%] md:w-[19%]",
    rotation: "3deg",
    delay: "-7.1s",
    duration: "10.3s",
  },
  {
    position:
      "right-[1%] top-[85%] w-[38%] sm:right-[8%] sm:w-[33%] md:right-[4%] md:top-[51%] md:w-[18%]",
    rotation: "-4deg",
    delay: "-2.9s",
    duration: "9.4s",
  },
] as const;

const singleProductLayout = {
  position:
    "left-1/2 top-1/2 w-[70%] -translate-x-1/2 -translate-y-1/2 sm:w-[52%] md:w-[25%]",
  rotation: "-2deg",
  delay: "-1.2s",
  duration: "9s",
} as const;

type FloatingStyle = CSSProperties & {
  "--float-delay": string;
  "--float-duration": string;
  "--product-rotation": string;
};

function chunkProducts<T>(products: T[], size: number) {
  return Array.from({ length: Math.ceil(products.length / size) }, (_, index) =>
    products.slice(index * size, index * size + size),
  );
}

export default async function DropDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const drop = await getPublicDropBySlug(slug);

  if (!drop) notFound();

  const productGroups = chunkProducts(drop.products ?? [], 8);

  return (
    <div className="pb-20">
      <div className="container mx-auto px-4 pt-8">
        {/* Keep the drop hero unchanged */}
        <section className="relative mb-10 overflow-hidden rounded-2xl bg-muted p-8 text-center">
          {drop.banner_image_url && (
            <Image
              src={drop.banner_image_url}
              alt={drop.name}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-30"
            />
          )}

          <div className="relative z-10 mx-auto max-w-3xl">
            <Badge className="mb-4">{drop.status}</Badge>

            <h1 className="text-4xl font-bold md:text-5xl">{drop.name}</h1>

            {drop.release_date && (
              <p className="mt-3 text-sm text-muted-foreground">
                Released{" "}
                {new Date(drop.release_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}

            {drop.description && (
              <p className="mt-4 text-lg text-muted-foreground">
                {drop.description}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Floating products */}
      <section className="relative isolate overflow-hidden bg-[#f7f7f5] py-12 dark:bg-neutral-950 md:py-20">
        {/* <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 blur-3xl dark:bg-white/[0.035]" />
          <div className="absolute left-[8%] top-[12%] h-64 w-64 rounded-full bg-violet-200/20 blur-3xl dark:bg-violet-500/[0.06]" />
          <div className="absolute bottom-[8%] right-[6%] h-72 w-72 rounded-full bg-blue-200/20 blur-3xl dark:bg-blue-500/[0.05]" />
        </div> */}

        <div className="relative mx-auto w-full max-w-[1600px] px-4 md:px-8">
          {/* <div className="relative z-20 mx-auto mb-2 max-w-xl text-center md:mb-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-black/40 dark:text-white/40">
              {drop.name}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black dark:text-white md:text-5xl">
              Explore the drop
            </h2>
          </div> */}

          {(drop.products ?? []).length === 0 ? (
            <div className="flex min-h-[480px] items-center justify-center">
              <Card className="border-black/5 bg-white/60 shadow-none backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
                <CardContent className="px-8 py-6 text-center text-sm text-black/45 dark:text-white/45">
                  No products have been added to this drop yet.
                </CardContent>
              </Card>
            </div>
          ) : (
            <div>
              {productGroups.map((products, groupIndex) => (
                <div
                  key={`floating-group-${groupIndex}`}
                  className="relative h-[1080px] w-full sm:h-[1180px] md:h-[720px] lg:h-[800px]"
                >
                  {products.map((product, index) => {
                    const layout =
                      products.length === 1
                        ? singleProductLayout
                        : floatingProductLayouts[index];

                    const image =
                      product.thumbnail_url || "/images/placeholder.svg";

                    const animationStyle: FloatingStyle = {
                      "--float-delay": layout.delay,
                      "--float-duration": layout.duration,
                      "--product-rotation": layout.rotation,
                    };

                    return (
                      <div
                        key={product.id}
                        className={`absolute ${layout.position}`}
                        style={{ zIndex: 10 + (index % 4) }}
                      >
                        <div
                          className={styles.floatingProduct}
                          style={animationStyle}
                        >
                          <Link
                            href={`/products/${product.id}`}
                            aria-label={`View ${product.name}`}
                            className="group relative block focus-visible:outline-none"
                          >
                            <div className="relative aspect-square w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:z-40 group-hover:scale-110 group-focus-visible:scale-110">
                              <Image
                                src={image}
                                alt={product.name}
                                fill
                                sizes="(min-width: 768px) 20vw, 42vw"
                                className="object-contain drop-shadow-[0_22px_25px_rgba(0,0,0,0.13)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-hover:drop-shadow-[0_35px_35px_rgba(0,0,0,0.18)] group-focus-visible:-translate-y-2"
                              />
                            </div>

                            <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-max max-w-[190px] -translate-x-1/2 translate-y-2 rounded-2xl border border-black/[0.06] bg-white/85 px-4 py-3 text-center opacity-0 shadow-[0_16px_45px_rgba(0,0,0,0.09)] backdrop-blur-2xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 dark:border-white/10 dark:bg-neutral-900/85">
                              <p className="line-clamp-1 text-xs font-medium text-black/80 dark:text-white/80">
                                {product.name}
                              </p>

                              <div className="mt-1 flex items-center justify-center gap-2">
                                {product.sale_price ? (
                                  <>
                                    <span className="text-[11px] font-semibold text-black dark:text-white">
                                      {formatPrice(product.sale_price)}
                                    </span>
                                    <span className="text-[10px] text-black/35 line-through dark:text-white/35">
                                      {formatPrice(product.price)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[11px] font-semibold text-black dark:text-white">
                                    {formatPrice(product.price)}
                                  </span>
                                )}
                              </div>

                              <ArrowUpRight className="mx-auto mt-2 h-3.5 w-3.5 text-black/40 dark:text-white/40" />
                            </div>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <div className="relative z-30 mt-2 flex items-center justify-center">
            <Link
              href="/products"
              className="group inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white/65 px-7 text-sm font-medium text-black shadow-[0_14px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-black/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              Shop all products
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
