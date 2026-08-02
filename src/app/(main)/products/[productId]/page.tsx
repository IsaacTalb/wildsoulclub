"use client";

import type { CSSProperties, PointerEvent, WheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  Minus,
  Plus,
  ShoppingCart,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import type { Product, ProductVariant } from "@/types";

import styles from "./product-gallery.module.css";

const PRODUCT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect width='20' height='20' fill='%23f5f5f5'/%3E%3Ccircle cx='10' cy='10' r='6' fill='%23e5e7eb'/%3E%3C/svg%3E";

interface PublicProductImage {
  id?: string | null;
  url?: string | null;
  image_url?: string | null;
  transparent_url?: string | null;
  is_thumbnail?: boolean;
  sort_order?: number;
}

interface PublicProductVariant {
  id: string;
  size?: string | null;
  color?: string | null;
  stock: number;
  price?: number | null;
  sale_price?: number | null;
  is_active: boolean;
}

interface PublicProduct {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  price: number;
  sale_price?: number | null;
  category_id?: string | null;
  category?: string | { name?: string | null } | null;
  categories?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  stock: number;
  sku?: string | null;
  sizes?: string[] | null;
  colors?: string[] | null;
  thumbnail_url?: string | null;
  product_images?: PublicProductImage[] | null;
  product_variants?: PublicProductVariant[] | null;
}

interface DisplayProduct extends PublicProduct {
  images: DisplayImage[];
  variants: PublicProductVariant[];
  sizes: string[];
  colors: string[];
}

interface DisplayImage {
  src: string;
  isTransparent: boolean;
}

type GallerySlideStyle = CSSProperties & {
  "--slide-x": string;
  "--slide-y": string;
  "--slide-scale": number;
  "--slide-opacity": number;
  "--slide-z": number;
};

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function LoopingProductGallery({
  images,
  productName,
  price,
  salePrice,
}: {
  images: DisplayImage[];
  productName: string;
  price: number;
  salePrice?: number | null;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  const swipeStart = useRef<{ pointerId: number; x: number; y: number } | null>(
    null,
  );

  const canLoop = images.length > 1;
  const slideOffsets = canLoop ? [-2, -1, 0, 1, 2] : [0];

  const moveGallery = useCallback(
    (nextDirection: -1 | 1) => {
      if (!canLoop || direction !== 0) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setActiveImage((current) =>
          wrapIndex(current + nextDirection, images.length),
        );
        return;
      }
      setDirection(nextDirection);
    },
    [canLoop, direction, images.length],
  );

  const finishMovement = useCallback(() => {
    if (direction === 0) return;

    setActiveImage((current) => wrapIndex(current + direction, images.length));
    setDirection(0);
  }, [direction, images.length]);

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!canLoop || Math.abs(event.deltaY) < 10) return;

    if (window.matchMedia("(min-width: 768px)").matches) {
      event.preventDefault();
      moveGallery(event.deltaY > 0 ? 1 : -1);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!canLoop || event.pointerType === "mouse") return;
    swipeStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const distanceX = start.x - event.clientX;
    const distanceY = start.y - event.clientY;
    swipeStart.current = null;

    if (Math.abs(distanceX) < 42 || Math.abs(distanceX) <= Math.abs(distanceY))
      return;
    event.preventDefault();
    moveGallery(distanceX > 0 ? 1 : -1);
  };

  const discountPercent =
    salePrice && price > 0
      ? Math.round(((price - salePrice) / price) * 100)
      : null;

  return (
    <section
      aria-label={`${productName} image gallery`}
      className={`${styles.galleryViewport} relative isolate w-full max-w-full overflow-hidden rounded-lg border border-foreground/10`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        swipeStart.current = null;
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
          event.preventDefault();
          moveGallery(1);
        }

        if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
          event.preventDefault();
          moveGallery(-1);
        }
      }}
      tabIndex={canLoop ? 0 : -1}
    >

      <div className="relative aspect-[4/5] min-h-[480px] w-full sm:min-h-[560px] md:h-[min(76vh,760px)] md:min-h-[620px] md:aspect-auto">
        {images.length > 0 ? (
          slideOffsets.map((offset) => {
            const visualOffset = offset - direction;
            const distanceFromCenter = Math.abs(visualOffset);
            const imageIndex = wrapIndex(activeImage + offset, images.length);
            const slideScale =
              distanceFromCenter === 0
                ? 1
                : distanceFromCenter === 1
                  ? 0.62
                  : 0.38;
            const slideOpacity =
              distanceFromCenter === 0
                ? 1
                : distanceFromCenter === 1
                  ? 0.52
                  : 0.12;

            const slideStyle: GallerySlideStyle = {
              "--slide-x": `${visualOffset * 73}%`,
              "--slide-y": `${visualOffset * 69}%`,
              "--slide-scale": slideScale,
              "--slide-opacity": slideOpacity,
              "--slide-z": 10 - distanceFromCenter,
            };

            return (
              <button
                key={offset}
                type="button"
                className={`${styles.gallerySlide} ${
                  direction !== 0 ? styles.gallerySlideMoving : ""
                } ${Math.abs(offset) > 1 ? "pointer-events-none" : ""}`}
                style={slideStyle}
                aria-disabled={offset === 0 || Math.abs(offset) > 1}
                tabIndex={offset === -1 || offset === 1 ? 0 : -1}
                aria-label={
                  offset < 0
                    ? "Show previous product image"
                    : offset > 0
                      ? "Show next product image"
                      : `Current image ${activeImage + 1} of ${images.length}`
                }
                onClick={() => {
                  if (offset < 0) moveGallery(-1);
                  if (offset > 0) moveGallery(1);
                }}
                onTransitionEnd={(event) => {
                  if (offset === 0 && event.propertyName === "transform") {
                    finishMovement();
                  }
                }}
              >
                <span className="relative block h-full w-full">
                  <Image
                    src={images[imageIndex].src}
                    alt={
                      offset === 0
                        ? productName
                        : `${productName} image ${imageIndex + 1}`
                    }
                    fill
                    sizes="(min-width: 1024px) 58vw, (min-width: 768px) 55vw, 92vw"
                    placeholder="blur"
                    blurDataURL={PRODUCT_IMAGE_PLACEHOLDER}
                    preload={offset === 0}
                    className={images[imageIndex].isTransparent ? "rounded-lg object-contain p-2 drop-shadow-[0_30px_35px_rgba(0,0,0,0.13)] sm:p-3 md:p-4" : "rounded-lg object-cover"}
                  />
                </span>
              </button>
            );
          })
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
      </div>

      {discountPercent && (
        <Badge className="absolute left-5 top-5 z-30 rounded-full bg-red-500 px-3 py-1 text-sm text-white shadow-lg">
          -{discountPercent}%
        </Badge>
      )}

      {canLoop && (
        <>
          <p className="pointer-events-none absolute bottom-5 left-5 z-30 hidden text-[9px] font-semibold uppercase tracking-[0.28em] text-foreground/35 md:block">
            Scroll to explore
          </p>

          <div
            className="absolute inset-x-0 bottom-5 z-30 flex items-center justify-center gap-2 md:hidden"
            aria-label={`Image ${activeImage + 1} of ${images.length}`}
          >
            {images.map((_, index) => (
              <span
                key={index}
                className={`block rounded-full transition-all duration-300 ${
                  index === activeImage
                    ? "h-2 w-5 bg-foreground/75"
                    : "h-2 w-2 bg-foreground/20"
                }`}
              />
            ))}
          </div>

          <p className="pointer-events-none absolute bottom-5 right-5 z-30 hidden text-[10px] font-medium tabular-nums text-foreground/35 md:block">
            {String(activeImage + 1).padStart(2, "0")} /{" "}
            {String(images.length).padStart(2, "0")}
          </p>
        </>
      )}
    </section>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<DisplayProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/public/products/${params.productId}`);
      const result = (await response.json()) as {
        data?: PublicProduct;
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error ?? "Failed to load product");

      const productData = result.data;
      if (!productData)
        throw new Error("Product response did not include a product");
      const productImages = (productData.product_images ?? []).flatMap((image): DisplayImage[] => {
        const original = image.url || image.image_url;
        const preferred = image.transparent_url || original;
        return preferred ? [{ src: preferred, isTransparent: Boolean(image.transparent_url) }] : [];
      });
      const imageUrls = productImages.length > 0
        ? productImages
        : productData.thumbnail_url
          ? [{ src: productData.thumbnail_url, isTransparent: false }]
          : [];

      setProduct({
        ...productData,
        images: imageUrls.filter((image, index, all) => all.findIndex((candidate) => candidate.src === image.src) === index),
        sizes: productData.sizes || [],
        colors: productData.colors || [],
        variants: productData.product_variants || [],
      });
      setQuantity(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [params.productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const requiresSize = Boolean(product?.sizes?.length);
  const requiresColor = Boolean(product?.colors?.length);
  const hasVariants = Boolean(product?.variants.length);
  const optionsComplete =
    (!requiresSize || Boolean(selectedSize)) &&
    (!requiresColor || Boolean(selectedColor));
  const activeVariants = useMemo(
    () => product?.variants.filter((variant) => variant.is_active) ?? [],
    [product],
  );
  const selectedVariant = useMemo(() => {
    if (!optionsComplete || !activeVariants.length) return null;
    return (
      activeVariants.find(
        (variant) =>
          (variant.size ?? "") === (requiresSize ? selectedSize : "") &&
          (variant.color ?? "") === (requiresColor ? selectedColor : ""),
      ) ?? null
    );
  }, [
    activeVariants,
    optionsComplete,
    requiresColor,
    requiresSize,
    selectedColor,
    selectedSize,
  ]);
  const effectiveStock = hasVariants
    ? selectedVariant
      ? Math.max(0, Number(selectedVariant.stock))
      : null
    : Math.max(0, Number(product?.stock ?? 0));
  const isSizeAvailable = (size: string) =>
    activeVariants.some(
      (variant) =>
        Number(variant.stock) > 0 &&
        variant.size === size &&
        (!selectedColor || variant.color === selectedColor),
    );
  const isColorAvailable = (color: string) =>
    activeVariants.some(
      (variant) =>
        Number(variant.stock) > 0 &&
        variant.color === color &&
        (!selectedSize || variant.size === selectedSize),
    );

  const clampQuantityForOptions = (size: string, color: string) => {
    const complete =
      (!requiresSize || Boolean(size)) && (!requiresColor || Boolean(color));
    const stock = complete
      ? activeVariants.find(
          (variant) =>
            (variant.size ?? "") === (requiresSize ? size : "") &&
            (variant.color ?? "") === (requiresColor ? color : ""),
        )?.stock
      : undefined;
    setQuantity((current) =>
      stock === undefined ? 1 : Math.max(1, Math.min(current, Number(stock))),
    );
  };

  const handleAddToCart = () => {
    if (
      !product ||
      !optionsComplete ||
      effectiveStock === null ||
      effectiveStock <= 0
    )
      return;
    const boundedQuantity = Math.min(Math.max(1, quantity), effectiveStock);

    const cartProduct: Product = {
      id: product.id,
      name: product.name,
      slug: product.slug ?? "",
      description: product.description ?? "",
      price: product.price,
      sale_price: product.sale_price ?? undefined,
      stock: product.stock,
      sizes: product.sizes,
      colors: product.colors,
      thumbnail_url: product.thumbnail_url ?? "",
      images: [],
      variants: product.variants.map(
        (variant): ProductVariant => ({
          ...variant,
          price: variant.price ?? undefined,
          sale_price: variant.sale_price ?? undefined,
          id: variant.id,
          product_id: product.id,
          size: variant.size ?? "",
          color: variant.color ?? "",
          sku: "",
          created_at: "",
        }),
      ),
      category_id: product.category_id || "",
      sku: product.sku || "",
      is_active: true,
      is_archived: false,
      is_featured: false,
      is_best_seller: false,
      best_seller_rank: 0,
      created_at: "",
      updated_at: "",
    };

    addItem(
      cartProduct,
      boundedQuantity,
      selectedSize || selectedVariant?.size || "",
      selectedColor || selectedVariant?.color || "",
      selectedVariant?.id,
    );
  };

  if (loading)
    return (
      <div className="container mx-auto px-4 py-8">Loading product...</div>
    );
  if (error)
    return <div className="container mx-auto px-4 py-8">Error: {error}</div>;
  if (!product)
    return <div className="container mx-auto px-4 py-8">Product not found</div>;

  return (
    <div className="min-h-screen bg-white py-5 md:px-4 md:py-8">
      <div className="container mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] lg:gap-10">
          {/* Image Gallery */}
          <LoopingProductGallery
            key={product.id}
            images={product.images}
            productName={product.name}
            price={product.price}
            salePrice={product.sale_price}
          />

          {/* Product Info */}
          <div className="glass-scrollbar mx-4 max-h-none w-[calc(100%-2rem)] overflow-visible rounded-[2.25rem] border border-black/10 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6 md:sticky md:top-20 md:mx-0 md:max-h-[calc(100svh-112px)] md:w-full md:max-w-[520px] md:justify-self-end md:overflow-y-auto md:overscroll-contain md:p-5 lg:p-6">
            <p className="mb-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {product.categories?.name ||
                (typeof product.category === "string"
                  ? product.category
                  : product.category?.name) ||
                "Uncategorized"}
            </p>
            <h1 className="mb-3 text-2xl font-bold lg:text-3xl">
              {product.name}
            </h1>

            <div className="mb-4 flex items-center gap-3">
              {selectedVariant?.price || product.sale_price ? (
                <>
                  <span className="text-2xl font-bold text-red-500">
                    {formatPrice(
                      Number(selectedVariant?.price || product.sale_price),
                    )}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 font-medium">
                  Size{" "}
                  {selectedSize && (
                    <span className="text-primary">- {selectedSize}</span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string) => {
                    const unavailable = hasVariants && !isSizeAvailable(size);
                    return (
                      <Button
                        key={size}
                        onClick={() => {
                          setSelectedSize(size);
                          clampQuantityForOptions(size, selectedColor);
                        }}
                        disabled={unavailable}
                        aria-label={`${size}${unavailable ? " (out of stock)" : ""}`}
                        variant={
                          selectedSize === size ? "liquid-primary" : "liquid"
                        }
                        size="touch"
                        aria-pressed={selectedSize === size}
                      >
                        {size}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 font-medium">
                  Color{" "}
                  {selectedColor && (
                    <span className="text-primary">- {selectedColor}</span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color: string) => {
                    const unavailable = hasVariants && !isColorAvailable(color);
                    return (
                      <Button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          clampQuantityForOptions(selectedSize, color);
                        }}
                        disabled={unavailable}
                        aria-label={`${color}${unavailable ? " (out of stock)" : ""}`}
                        variant={
                          selectedColor === color ? "liquid-primary" : "liquid"
                        }
                        size="touch"
                        aria-pressed={selectedColor === color}
                      >
                        {color}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-4">
              <h3 className="mb-2 font-medium">Quantity</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="liquid"
                  size="icon-touch"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium w-8 text-center">
                  {quantity}
                </span>
                <Button
                  variant="liquid"
                  size="icon-touch"
                  onClick={() =>
                    effectiveStock !== null &&
                    setQuantity(Math.min(effectiveStock, quantity + 1))
                  }
                  disabled={
                    effectiveStock === null ||
                    effectiveStock <= 0 ||
                    quantity >= effectiveStock
                  }
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span
                  className="min-w-0 basis-full text-sm text-muted-foreground sm:ml-2 sm:basis-auto"
                  role="status"
                  aria-live="polite"
                >
                  {!optionsComplete
                    ? `Select ${[requiresSize && !selectedSize ? "a size" : "", requiresColor && !selectedColor ? "a color" : ""].filter(Boolean).join(" and ")} to see availability`
                    : effectiveStock === null || effectiveStock <= 0
                      ? "Out of stock"
                      : `${effectiveStock} available`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Button
                variant="liquid-primary"
                size="touch"
                className="w-full min-w-0 flex-1 text-base"
                onClick={handleAddToCart}
                disabled={
                  !optionsComplete ||
                  effectiveStock === null ||
                  effectiveStock <= 0
                }
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </Button>
              <Button
                variant="liquid"
                size="touch"
                className="w-full sm:w-auto"
              >
                <Heart className="mr-2 h-5 w-5" /> Wishlist
              </Button>
            </div>

            <div className="mt-4 border-t border-foreground/10">
              <section className="border-b border-foreground/10">
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between py-3 text-left font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-expanded={descriptionOpen}
                  aria-controls="product-description-panel"
                  onClick={() => setDescriptionOpen((open) => !open)}
                >
                  <span>Description</span>
                  {descriptionOpen ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                </button>
                <div
                  id="product-description-panel"
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${descriptionOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="min-w-0 overflow-hidden">
                    <p className="break-words pb-4 text-sm whitespace-pre-line leading-relaxed text-muted-foreground">
                      {product.description || "No product description is available yet."}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between py-3 text-left font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-expanded={sizeChartOpen}
                  aria-controls="product-size-chart-panel"
                  onClick={() => setSizeChartOpen((open) => !open)}
                >
                  <span>Size Chart</span>
                  {sizeChartOpen ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                </button>
                <div
                  id="product-size-chart-panel"
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${sizeChartOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="min-w-0 overflow-hidden">
                    {product.sizes.length > 0 ? (
                      <div className="mb-2 overflow-x-auto rounded-lg border border-foreground/10">
                        <table className="w-full min-w-[18rem] border-collapse text-left text-sm">
                          <thead className="bg-foreground/5"><tr><th scope="col" className="px-3 py-2 font-semibold">Size</th><th scope="col" className="px-3 py-2 font-semibold">Availability</th></tr></thead>
                          <tbody>{product.sizes.map((size) => <tr key={size} className="border-t border-foreground/10"><th scope="row" className="px-3 py-2 font-medium">{size}</th><td className="px-3 py-2 text-muted-foreground">{hasVariants ? (isSizeAvailable(size) ? "In stock" : "Out of stock") : "Available"}</td></tr>)}</tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="mb-2 border-t border-dashed border-foreground/20 py-3 text-sm text-muted-foreground">Sizing information is not available for this item. Contact us for fit and measurement guidance before ordering.</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
