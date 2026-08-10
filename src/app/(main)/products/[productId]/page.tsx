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
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import type { Product, ProductVariant } from "@/types";

import styles from "./product-gallery.module.css";
import { ProductDetailSkeleton } from "./product-detail-skeleton";

const PRODUCT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect width='20' height='20' fill='%23f5f5f5'/%3E%3Ccircle cx='10' cy='10' r='6' fill='%23e5e7eb'/%3E%3C/svg%3E";

const SIZE_CHART = {
  S: { Length: "25.5", Chest: "19", Shoulder: "18.5", Sleeve: "8.5" },
  M: { Length: "26.5", Chest: "20.5", Shoulder: "19.5", Sleeve: "9" },
  L: { Length: "27.5", Chest: "22", Shoulder: "20.5", Sleeve: "9.5" },
  XL: { Length: "28.5", Chest: "24", Shoulder: "21", Sleeve: "10" },
} as const;

type ChartSize = keyof typeof SIZE_CHART;
type Measurement = keyof (typeof SIZE_CHART)[ChartSize];
const CHART_SIZE_ORDER: ChartSize[] = ["S", "M", "L", "XL"];
const MEASUREMENTS: Measurement[] = ["Length", "Chest", "Shoulder", "Sleeve"];

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
}: {
  images: DisplayImage[];
  productName: string;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(() => new Set());
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

  return (
    <section
      aria-label={`${productName} image gallery`}
      className={`${styles.galleryViewport} relative isolate w-full max-w-full`}
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

      <div className="relative aspect-[4/5] min-h-[480px] w-full rounded-[1.75rem] sm:min-h-[560px] md:aspect-auto md:h-[calc(100svh-var(--site-header-height)-2.5rem)] md:min-h-[640px] md:max-h-[1140px] xl:max-h-[1290px] 2xl:max-h-[1440px]">
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
              "--slide-x": `${visualOffset * 68}%`,
              "--slide-y": `${visualOffset * 70}%`,
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
                    sizes="(min-width: 1280px) 58vw,(min-width: 1024px) 56vw,(min-width: 768px) 55vw,92vw"
                    placeholder="blur"
                    blurDataURL={PRODUCT_IMAGE_PLACEHOLDER}
                    preload={offset === 0}
                    className={`${loadedImages.has(images[imageIndex].src) ? styles.galleryImageLoaded : styles.galleryImageLoading} ${images[imageIndex].isTransparent ? "rounded-lg object-contain p-2 drop-shadow-[0_30px_35px_rgba(0,0,0,0.13)] sm:p-3 md:p-4" : "rounded-lg object-cover"}`}
                    onLoad={() => {
                      setLoadedImages((current) => {
                        if (current.has(images[imageIndex].src)) return current;
                        const next = new Set(current);
                        next.add(images[imageIndex].src);
                        return next;
                      });
                    }}
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

      {/* {discountPercent && (
        <Badge className="absolute left-5 top-5 z-30 rounded-full bg-red-500 px-3 py-1 text-sm text-white shadow-lg">
          -{discountPercent}%
        </Badge>
      )} */}

      {canLoop && (
        <>
          <p className="pointer-events-none absolute mt-2 bottom-3 left-5 z-30 hidden text-[9px] font-semibold uppercase tracking-[0.28em] text-foreground/35 md:block">
            Scroll to explore
          </p>

          <div
            className="absolute inset-x-0 mt-2 bottom-3 z-30 flex items-center justify-center gap-2 md:hidden"
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
  const wishlistItems = useWishlist((state) => state.items);
  const toggleWishlistItem = useWishlist((state) => state.toggleItem);
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
  const isWishlisted = Boolean(
    product && wishlistItems.some((item) => item.id === product.id),
  );
  const chartSizes = CHART_SIZE_ORDER.filter((size) =>
    product?.sizes.some((productSize) => productSize.trim().toUpperCase() === size),
  );
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

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlistItem({
      id: product.id,
      name: product.name,
      slug: product.slug ?? "",
      price: product.price,
      salePrice: product.sale_price ?? undefined,
      thumbnailUrl: product.images[0]?.src ?? product.thumbnail_url ?? undefined,
    });
  };

  if (loading) return <ProductDetailSkeleton />;
  if (error)
    return <div className="container mx-auto px-4 py-8">Error: {error}</div>;
  if (!product)
    return <div className="container mx-auto px-4 py-8">Product not found</div>;

  return (
    <div className="min-h-screen overflow-x-clip bg-white py-5 md:-mt-[var(--site-header-height)] md:h-svh md:min-h-0 md:overflow-hidden md:px-4 md:pb-4 md:pt-[calc(var(--site-header-height)+1.5rem)]">
      <div className="container mx-auto max-w-[1300px]">
        <div className="grid grid-cols-1 items-start gap-7 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.58fr)] lg:gap-12">
          {/* Image Gallery */}
          <LoopingProductGallery
            key={product.id}
            images={product.images}
            productName={product.name}
          />

          {/* Product Info */}
          <div className="glass-scrollbar relative z-20 mx-4 max-h-none w-[calc(100%-2rem)] overflow-visible rounded-[1.75rem] border border-black/10 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5 md:sticky md:top-20 md:mx-0 md:max-h-[calc(100svh-112px)] md:w-full md:max-w-[440px] md:justify-self-end md:overflow-y-auto md:overscroll-contain md:p-5">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {product.categories?.name ||
                (typeof product.category === "string"
                  ? product.category
                  : product.category?.name) ||
                "Uncategorized"}
            </p>
            <h1 className="mb-2 text-xl font-semibold leading-tight lg:text-2xl">
              {product.name}
            </h1>

            <div className="mb-3 flex items-center gap-2.5">
              {selectedVariant?.price || product.sale_price ? (
                <>
                  <span className="text-xl font-semibold text-red-500">
                    {formatPrice(
                      Number(selectedVariant?.price || product.sale_price),
                    )}
                  </span>
                  {/* <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span> */}
                </>
              ) : (
                <span className="text-xl font-semibold">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-3">
                <h3 className="mb-1.5 text-sm font-medium">
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
              <div className="mb-3">
                <h3 className="mb-1.5 text-sm font-medium">
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
            <div className="mb-3">
              <h3 className="mb-1.5 text-sm font-medium">Quantity</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="liquid"
                  size="icon-touch"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-7 text-center text-sm font-medium">
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
                  className="w-full min-w-0 flex-1 text-sm"
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
                variant={isWishlisted ? "liquid-primary" : "liquid"}
                size="touch"
                className="w-full sm:w-auto"
                onClick={handleToggleWishlist}
                aria-pressed={isWishlisted}
              >
                <Heart className={`mr-2 h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
                {isWishlisted ? "Wishlisted" : "Wishlist"}
              </Button>
            </div>

            <div className="mt-3 border-t border-foreground/10 text-sm">
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
                    {chartSizes.length > 0 ? (
                      <div className="mb-2 overflow-x-auto rounded-lg border border-foreground/10">
                        <table className="w-full min-w-[22rem] border-collapse text-right text-sm">
                          <thead className="bg-foreground/5">
                            <tr>
                              <th scope="col" className="whitespace-nowrap px-3 py-2 text-left font-semibold">Measurement (inches)</th>
                              {chartSizes.map((size) => (
                                <th key={size} scope="col" className="px-3 py-2 font-semibold">
                                  {size}{size === "S" ? <span className="block text-[10px] font-normal text-muted-foreground">Estimated</span> : null}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {MEASUREMENTS.map((measurement) => (
                              <tr key={measurement} className="border-t border-foreground/10">
                                <th scope="row" className="px-3 py-2 text-left font-medium">{measurement}</th>
                                {chartSizes.map((size) => (
                                  <td key={size} className="px-3 py-2 tabular-nums text-muted-foreground">{SIZE_CHART[size][measurement]}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
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
