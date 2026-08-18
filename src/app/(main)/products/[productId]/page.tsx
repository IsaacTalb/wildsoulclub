"use client";

import type { CSSProperties, PointerEvent, WheelEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Check,
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
import type { SizeChart } from "@/lib/size-chart";

import styles from "./product-gallery.module.css";
import { ProductDetailSkeleton } from "./product-detail-skeleton";

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
  is_archived?: boolean | null;
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
  size_chart?: SizeChart | null;
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

interface ProductGalleryProps {
  images: DisplayImage[];
  productName: string;
}

type GallerySlideStyle = CSSProperties & {
  "--slide-x": string;
  "--slide-y": string;
  "--slide-scale": number;
  "--desktop-slide-scale": number;
  "--slide-opacity": number;
  "--desktop-slide-opacity": number;
  "--slide-z": number;
};

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function MobileProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
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

    // A short, intentional horizontal gesture should be enough on a phone.
    // The direction check still lets ordinary vertical page scrolling through.
    if (Math.abs(distanceX) < 18 || Math.abs(distanceX) < Math.abs(distanceY) * 1.15)
      return;
    event.preventDefault();
    moveGallery(distanceX > 0 ? 1 : -1);
  };

  return (
    <section
      aria-label={`${productName} image gallery`}
      className={`${styles.galleryViewport} relative isolate w-full max-w-full lg:hidden`}
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

      <div className="relative aspect-[4/5] min-h-[480px] w-full rounded-[1.75rem] sm:min-h-[560px] md:aspect-auto md:h-[calc(100svh-var(--site-header-height)-5.5rem)] md:min-h-[580px] md:max-h-[1080px] xl:h-[calc(100svh-var(--site-header-height)-5rem)] xl:max-h-[1230px] 2xl:max-h-[1380px]">
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
            const desktopSlideScale =
              distanceFromCenter === 0
                ? 1
                : distanceFromCenter === 1
                  ? 0.52
                  : 0.3;
            const desktopSlideOpacity =
              distanceFromCenter === 0
                ? 1
                : distanceFromCenter === 1
                  ? 0.38
                  : 0.08;

            const slideStyle: GallerySlideStyle = {
              "--slide-x": `${visualOffset * 78}%`,
              "--slide-y": `${visualOffset * 78}%`,
              "--slide-scale": slideScale,
              "--desktop-slide-scale": desktopSlideScale,
              "--slide-opacity": slideOpacity,
              "--desktop-slide-opacity": desktopSlideOpacity,
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
                <span className={styles.galleryImageStage}>
                  {/* Preserve source-asset whitespace; loose assets should be tightly cropped or supplied as transparent WebP/PNG files. */}
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
                    className={`${loadedImages.has(images[imageIndex].src) ? styles.galleryImageLoaded : styles.galleryImageLoading} object-contain`}
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
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute left-3 top-1/2 z-30 h-11 w-11 -translate-y-1/2 rounded-full border-white/70 bg-white/85 shadow-lg backdrop-blur md:hidden"
            onClick={() => moveGallery(-1)}
            aria-label="Show previous product image"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-3 top-1/2 z-30 h-11 w-11 -translate-y-1/2 rounded-full border-white/70 bg-white/85 shadow-lg backdrop-blur md:hidden"
            onClick={() => moveGallery(1)}
            aria-label="Show next product image"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
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

function DesktopProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
  const galleryRef = useRef<HTMLElement | null>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const imageListKey = JSON.stringify(images.map((image) => image.src));

  useEffect(() => {
    sectionRefs.current = Array.from(
      galleryRef.current?.querySelectorAll<HTMLElement>(
        "[data-product-image-section]",
      ) ?? [],
    );
  }, [imageListKey]);

  useEffect(() => {
    const sections = sectionRefs.current.filter(
      (section): section is HTMLElement => section !== null,
    );
    if (sections.length === 0) return;

    const intersectionRatios = new Map<Element, number>(
      sections.map((section) => [section, 0]),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          intersectionRatios.set(
            entry.target,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        });

        let mostVisibleIndex = -1;
        let highestRatio = 0;
        sections.forEach((section, index) => {
          const ratio = intersectionRatios.get(section) ?? 0;
          if (ratio > highestRatio) {
            highestRatio = ratio;
            mostVisibleIndex = index;
          }
        });

        if (mostVisibleIndex >= 0) setActiveImage(mostVisibleIndex);
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [imageListKey]);

  const scrollToImage = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  return (
    <section
      ref={galleryRef}
      aria-label={`${productName} image gallery`}
      className="relative hidden w-full lg:block"
    >
      {images.length > 0 ? (
        <>
          <div className="pointer-events-none sticky top-[var(--site-header-height)] z-20 -mb-[calc(100svh-var(--site-header-height))] h-[calc(100svh-var(--site-header-height))]">
            <nav
              aria-label="Choose a product image"
              className="pointer-events-auto absolute left-5 top-1/2 flex -translate-y-1/2 flex-col gap-2"
            >
              {images.map((image, index) => (
                <button
                  key={`${image.src || "image"}-${index}`}
                  type="button"
                  aria-label={`View ${productName} image ${index + 1}`}
                  aria-current={index === activeImage ? "true" : undefined}
                  onClick={() => scrollToImage(index)}
                  className="relative h-14 w-11 overflow-hidden rounded-md border border-foreground/10 bg-background/80 opacity-55 shadow-sm backdrop-blur transition hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground aria-[current=true]:border-foreground/60 aria-[current=true]:opacity-100"
                >
                  <Image
                    src={image.src}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-contain"
                  />
                </button>
              ))}
            </nav>
            <p className="absolute bottom-5 left-5 text-[9px] font-semibold uppercase tracking-[0.28em] text-foreground/35">
              Scroll to explore
            </p>
            <p className="absolute bottom-5 right-5 rounded-full bg-background/70 px-3 py-1.5 text-[10px] font-medium tabular-nums text-foreground/45 backdrop-blur">
              {String(activeImage + 1).padStart(2, "0")} /{" "}
              {String(images.length).padStart(2, "0")}
            </p>
          </div>

          {images.map((image, index) => (
            <section
              key={`${image.src || "image"}-${index}`}
              ref={(section) => {
                sectionRefs.current[index] = section;
              }}
              data-product-image-section
              className="relative min-h-[calc(100svh-var(--site-header-height))] scroll-mt-[var(--site-header-height)]"
            >
              <Image
                src={image.src}
                alt={
                  index === 0
                    ? productName
                    : `${productName} image ${index + 1}`
                }
                fill
                sizes="(min-width: 1280px) 60vw,55vw"
                placeholder="blur"
                blurDataURL={PRODUCT_IMAGE_PLACEHOLDER}
                preload={index === 0}
                className="object-contain"
              />
            </section>
          ))}
        </>
      ) : (
        <section className="flex min-h-[calc(100svh-var(--site-header-height))] scroll-mt-[var(--site-header-height)] items-center justify-center text-muted-foreground">
          No Image
        </section>
      )}
    </section>
  );
}

function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  return (
    <>
      <MobileProductGallery images={images} productName={productName} />
      <DesktopProductGallery images={images} productName={productName} />
    </>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const wishlistItems = useWishlist((state) => state.items);
  const toggleWishlistItem = useWishlist((state) => state.toggleItem);
  const [product, setProduct] = useState<DisplayProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
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
      is_archived: product.is_archived ?? false,
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
    setIsAdded(true);
    window.setTimeout(() => router.push("/cart"), 650);
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

  const effectiveRegularPrice = Number(
    selectedVariant?.price ?? product.price,
  );
  const salePrice = selectedVariant?.sale_price ?? product.sale_price;
  const effectiveSalePrice = salePrice == null ? null : Number(salePrice);
  const hasValidSalePrice =
    effectiveSalePrice !== null &&
    Number.isFinite(effectiveSalePrice) &&
    effectiveSalePrice > 0 &&
    effectiveSalePrice < effectiveRegularPrice;
  const showStruckThroughRegularPrice =
    product.is_archived === true && hasValidSalePrice;

  return (
    <div className="min-h-screen overflow-x-clip bg-white py-5 md:-mt-[var(--site-header-height)] md:h-svh md:min-h-0 md:overflow-hidden md:px-4 md:pb-4 md:pt-[calc(var(--site-header-height)+1.5rem)] lg:h-auto lg:min-h-screen lg:overflow-y-visible">
      <div className="container mx-auto max-w-[1300px]">
        <div className="grid grid-cols-1 items-start gap-7 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.58fr)] lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] lg:gap-12">
          {/* Image Gallery */}
          <ProductGallery
            key={product.id}
            images={product.images}
            productName={product.name}
          />

          {/* Product Info */}
          <div className="glass-scrollbar relative z-20 mx-4 max-h-none w-[calc(100%-2rem)] overflow-visible rounded-[1.75rem] border border-black/10 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5 md:sticky md:top-4 md:mx-0 md:-translate-y-4 md:max-h-[calc(100svh-112px)] md:w-full md:max-w-[440px] md:justify-self-end md:overflow-y-auto md:overscroll-contain md:p-5 lg:top-[calc(var(--site-header-height)+1rem)] lg:max-h-[calc(100svh-var(--site-header-height)-2rem)] lg:max-w-none lg:translate-y-0">
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
              {hasValidSalePrice ? (
                <>
                  <span className="text-xl font-semibold text-red-500">
                    {formatPrice(effectiveSalePrice)}
                  </span>
                  {showStruckThroughRegularPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(effectiveRegularPrice)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xl font-semibold">
                  {formatPrice(effectiveRegularPrice)}
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
                  isAdded ||
                  !optionsComplete ||
                  effectiveStock === null ||
                  effectiveStock <= 0
                }
              >
                {isAdded ? (
                  <>
                    <Check className="mr-2 h-5 w-5 text-black" /> Added! Opening cart…
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5 text-black" /> Add to Cart
                  </>
                )}
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

              {product.size_chart && <section>
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
                      <div className="mb-2 overflow-x-auto rounded-lg border border-foreground/10">
                        <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
                          <caption className="border-b border-foreground/10 px-3 py-2 text-left text-xs text-muted-foreground">
                            {product.size_chart.title}
                          </caption>
                          <thead className="bg-foreground/5">
                            <tr>
                              {product.size_chart.columns.map((column, index) => (
                                <th key={`${column}-${index}`} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {product.size_chart.rows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-t border-foreground/10">
                                {row.map((cell, cellIndex) => cellIndex === 0 ? (
                                  <th key={cellIndex} scope="row" className="px-3 py-2 font-medium">{cell}</th>
                                ) : (
                                  <td key={cellIndex} className="px-3 py-2 tabular-nums text-muted-foreground">{cell || "—"}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                  </div>
                </div>
              </section>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
