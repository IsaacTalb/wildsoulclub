"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type ProductRelation = {
  id?: string;
  name?: string | null;
  slug?: string | null;
};

type HomeDrop = ProductRelation & {
  release_date?: string | null;
  status?: "draft" | "scheduled" | "active" | "archived" | null;
};

type ProductCollection = ProductRelation & {
  start_date?: string | null;
  end_date?: string | null;
};

type ProductImage = {
  url?: string | null;
  image_url?: string | null;
  object_key?: string | null;
};

type HomeProduct = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;

  price: number;
  sale_price?: number | null;
  discount_percent?: number | null;

  stock?: number | null;
  is_archived?: boolean | null;
  deleted_at?: string | null;
  is_active?: boolean | null;

  category?: string | ProductRelation | null;
  category_id?: string | null;

  collection_id?: string | null;
  drop_id?: string | null;

  collection?: ProductCollection | null;
  drop?: HomeDrop | null;

  is_new_drop?: boolean | null;
  is_featured?: boolean | null;
  is_archive_sale?: boolean | null;

  new_drop_start_date?: string | null;
  new_drop_end_date?: string | null;

  thumbnail_url?: string | null;
  thumbnail_key?: string | null;

  product_images?: ProductImage[] | null;
};

type HomeCollection = {
  id: string;
  name: string;
  slug: string;

  description?: string | null;
  image_url?: string | null;
  object_key?: string | null;

  start_date?: string | null;
  end_date?: string | null;
};

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  startDate: string | null;
  endDate: string | null;
};

type CountdownValue = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type CountdownStatus = {
  state: "upcoming" | "live" | "ended" | "untimed";
  label: string;
  countdown: CountdownValue | null;
};

/* -------------------------------------------------------------------------- */
/*                              Image utilities                               */
/* -------------------------------------------------------------------------- */

function getImageUrl(
  imageUrl?: string | null,
  objectKey?: string | null,
) {
  return imageUrl || objectKey || "";
}

function getProductImage(product: HomeProduct) {
  return (
    product.thumbnail_url ||
    product.product_images?.[0]?.url ||
    product.product_images?.[0]?.image_url ||
    product.product_images?.[0]?.object_key ||
    ""
  );
}

function preloadImages(urls: string[]) {
  urls
    .filter(Boolean)
    .slice(0, 12)
    .forEach((url) => {
      const image = new window.Image();
      image.src = url;
    });
}

/* -------------------------------------------------------------------------- */
/*                             Product utilities                              */
/* -------------------------------------------------------------------------- */

function getCategoryName(category: HomeProduct["category"]) {
  if (typeof category === "string") {
    return category;
  }

  return category?.name || "Wild Soul Club";
}

function normalizeDate(
  date?: string | null,
  endOfDay = false,
) {
  if (!date) {
    return null;
  }

  /*
   * Supabase DATE columns may return YYYY-MM-DD without a time.
   * Add a time so collection start/end dates behave correctly.
   */
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return endOfDay
      ? `${date}T23:59:59`
      : `${date}T00:00:00`;
  }

  return date;
}

function getHeroDates(product: HomeProduct) {
  /*
   * Start-date priority:
   * 1. Product new-drop start date
   * 2. Drop release date
   * 3. Collection start date
   *
   * End-date priority:
   * 1. Product new-drop end date
   * 2. Collection end date
   */

  const productStartDate = normalizeDate(
    product.new_drop_start_date,
  );

  const productEndDate = normalizeDate(
    product.new_drop_end_date,
    true,
  );

  const dropReleaseDate = normalizeDate(
    product.drop?.release_date,
  );

  const collectionStartDate = normalizeDate(
    product.collection?.start_date,
  );

  const collectionEndDate = normalizeDate(
    product.collection?.end_date,
    true,
  );

  return {
    startDate:
      productStartDate ||
      dropReleaseDate ||
      collectionStartDate,
    endDate: productEndDate || collectionEndDate,
  };
}

/* -------------------------------------------------------------------------- */
/*                            Countdown utilities                             */
/* -------------------------------------------------------------------------- */

function calculateTimeRemaining(
  targetDate: string,
  currentTime: number,
): CountdownValue | null {
  const targetTime = new Date(targetDate).getTime();

  if (Number.isNaN(targetTime)) {
    return null;
  }

  const difference = Math.max(
    0,
    targetTime - currentTime,
  );

  return {
    days: Math.floor(
      difference / (1000 * 60 * 60 * 24),
    ),
    hours: Math.floor(
      (difference / (1000 * 60 * 60)) % 24,
    ),
    minutes: Math.floor(
      (difference / (1000 * 60)) % 60,
    ),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function getCountdownStatus(
  startDate: string | null,
  endDate: string | null,
  currentTime: number,
): CountdownStatus {
  const startTime = startDate
    ? new Date(startDate).getTime()
    : null;

  const endTime = endDate
    ? new Date(endDate).getTime()
    : null;

  const hasValidStartTime =
    startTime !== null && !Number.isNaN(startTime);

  const hasValidEndTime =
    endTime !== null && !Number.isNaN(endTime);

  if (
    hasValidStartTime &&
    currentTime < startTime
  ) {
    return {
      state: "upcoming",
      label: "Drops In",
      countdown: calculateTimeRemaining(
        startDate!,
        currentTime,
      ),
    };
  }

  if (
    hasValidEndTime &&
    currentTime < endTime
  ) {
    return {
      state: "live",
      label: "Live Now · Ends In",
      countdown: calculateTimeRemaining(
        endDate!,
        currentTime,
      ),
    };
  }

  if (
    hasValidStartTime &&
    currentTime >= startTime &&
    !hasValidEndTime
  ) {
    return {
      state: "live",
      label: "Live Now",
      countdown: null,
    };
  }

  if (
    hasValidEndTime &&
    currentTime >= endTime
  ) {
    return {
      state: "ended",
      label: "Drop Ended",
      countdown: null,
    };
  }

  return {
    state: "untimed",
    label: "Available Now",
    countdown: null,
  };
}

function padCountdownNumber(value: number) {
  return String(value).padStart(2, "0");
}

/* -------------------------------------------------------------------------- */
/*                         Countdown UI components                            */
/* -------------------------------------------------------------------------- */

function CountdownUnit({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="flex min-w-[58px] flex-col items-center sm:min-w-[76px]">
      <span className="text-xl font-semibold tabular-nums tracking-tight text-white sm:text-2xl">
        {padCountdownNumber(value)}
      </span>

      <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-white/55 sm:text-[10px]">
        {label}
      </span>
    </div>
  );
}

function HeroCountdown({
  startDate,
  endDate,
  currentTime,
}: {
  startDate: string | null;
  endDate: string | null;
  currentTime: number | null;
}) {
  if (currentTime === null) {
    return (
      <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-white/[0.09] px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
        <div className="flex items-center justify-center gap-3">
          <div className="h-8 w-12 animate-pulse rounded-lg bg-white/10" />
          <div className="h-8 w-12 animate-pulse rounded-lg bg-white/10" />
          <div className="h-8 w-12 animate-pulse rounded-lg bg-white/10" />
          <div className="h-8 w-12 animate-pulse rounded-lg bg-white/10" />
        </div>
      </div>
    );
  }

  const status = getCountdownStatus(
    startDate,
    endDate,
    currentTime,
  );

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-white/[0.09] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:px-6 sm:py-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
      />

      <div className="relative flex flex-col items-center">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              status.state === "live"
                ? "animate-pulse bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                : status.state === "upcoming"
                  ? "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.7)]"
                  : status.state === "ended"
                    ? "bg-white/35"
                    : "bg-white/80"
            }`}
          />

          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75 sm:text-xs">
            {status.label}
          </span>
        </div>

        {status.countdown ? (
          <div className="flex items-center justify-center divide-x divide-white/15">
            <CountdownUnit
              value={status.countdown.days}
              label="Days"
            />

            <CountdownUnit
              value={status.countdown.hours}
              label="Hours"
            />

            <CountdownUnit
              value={status.countdown.minutes}
              label="Mins"
            />

            <CountdownUnit
              value={status.countdown.seconds}
              label="Secs"
            />
          </div>
        ) : (
          <p className="text-sm font-medium text-white/75">
            {status.state === "ended"
              ? "Explore our latest available pieces."
              : "The collection is available now."}
          </p>
        )}
      </div>
    </div>
  );
}

type ProductDisplayStatus = {
  label: string;
  unavailable: boolean;
};

function getProductDisplayStatus(
  product: HomeProduct,
): ProductDisplayStatus | null {
  if (product.deleted_at) {
    return {
      label: "Removed",
      unavailable: true,
    };
  }

  if (product.is_archived) {
    return {
      label: "Archive",
      unavailable: true,
    };
  }

  if (product.is_active === false) {
    return {
      label: "Unavailable",
      unavailable: true,
    };
  }

  if ((product.stock ?? 0) <= 0) {
    return {
      label: "Sold",
      unavailable: true,
    };
  }

  if (product.is_archive_sale) {
    return {
      label: "Archive Sale",
      unavailable: false,
    };
  }

  if (product.is_new_drop) {
    return {
      label: "New Drop",
      unavailable: false,
    };
  }

  return null;
}

const floatingProductLayouts = [
  {
    desktop:
      "md:left-[5%] md:top-[9%] md:w-[17%]",
    mobile:
      "left-[3%] top-[5%] w-[39%]",
    rotation: "-2deg",
    delay: "0s",
    duration: "7.2s",
  },
  {
    desktop:
      "md:left-[34%] md:top-[2%] md:w-[13%]",
    mobile:
      "right-[5%] top-[2%] w-[31%]",
    rotation: "2deg",
    delay: "-1.4s",
    duration: "8.4s",
  },
  {
    desktop:
      "md:left-[43%] md:top-[27%] md:w-[18%]",
    mobile:
      "left-[29%] top-[30%] w-[42%]",
    rotation: "0deg",
    delay: "-2.3s",
    duration: "7.8s",
  },
  {
    desktop:
      "md:right-[8%] md:top-[12%] md:w-[13%]",
    mobile:
      "right-[3%] top-[21%] w-[27%]",
    rotation: "3deg",
    delay: "-3.1s",
    duration: "9s",
  },
  {
    desktop:
      "md:left-[8%] md:top-[55%] md:w-[12%]",
    mobile:
      "left-[4%] top-[57%] w-[29%]",
    rotation: "-4deg",
    delay: "-0.8s",
    duration: "8.8s",
  },
  {
    desktop:
      "md:right-[18%] md:top-[45%] md:w-[16%]",
    mobile:
      "right-[6%] top-[52%] w-[36%]",
    rotation: "1deg",
    delay: "-4s",
    duration: "7.5s",
  },
  {
    desktop:
      "md:right-[-2%] md:top-[75%] md:w-[15%]",
    mobile:
      "right-[-5%] top-[77%] w-[34%]",
    rotation: "-2deg",
    delay: "-2.8s",
    duration: "9.4s",
  },
  {
    desktop:
      "md:left-[27%] md:top-[72%] md:w-[14%]",
    mobile:
      "left-[29%] top-[80%] w-[30%]",
    rotation: "3deg",
    delay: "-1.9s",
    duration: "8.1s",
  },
];

/* -------------------------------------------------------------------------- */
/*                                 Home page                                  */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const [homeProducts, setHomeProducts] = useState<
    HomeProduct[]
  >([]);

  const [collections, setCollections] = useState<
    HomeCollection[]
  >([]);

  const [loadingHomeData, setLoadingHomeData] =
    useState(true);

  /*
   * Start with null to prevent a server/client hydration mismatch.
   * The real time is added after the component mounts.
   */
  const [currentTime, setCurrentTime] = useState<
    number | null
  >(null);

  const heroSlides = useMemo<HeroSlide[]>(() => {
    return homeProducts
      .filter(
        (product) =>
          product.is_new_drop || product.is_featured,
      )
      .slice(0, 3)
      .map((product) => {
        const { startDate, endDate } =
          getHeroDates(product);

        return {
          id: product.id,
          title: product.name,
          subtitle:
            product.drop?.name ||
            product.collection?.name ||
            getCategoryName(product.category),
          image: getProductImage(product),
          href: `/products/${product.slug || product.id}`,
          startDate,
          endDate,
        };
      });
  }, [homeProducts]);

  const featuredProducts = useMemo(() => {
    return homeProducts
      .filter((product) => product.is_featured)
      .slice(0, 8);
  }, [homeProducts]);

  /* ------------------------------------------------------------------------ */
  /*                              Fetch home data                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoadingHomeData(true);

        const [productsResponse, collectionsResponse] =
          await Promise.all([
            fetch("/api/public/products?sort=newest", {
              cache: "no-store",
            }),
            fetch("/api/public/collections", {
              cache: "no-store",
            }),
          ]);

        if (productsResponse.ok) {
          const productsJson =
            await productsResponse.json();

          const products = (
            productsJson.data || []
          ) as HomeProduct[];

          setHomeProducts(products);

          preloadImages(
            products
              .slice(0, 12)
              .map(getProductImage),
          );
        } else {
          setHomeProducts([]);
        }

        if (collectionsResponse.ok) {
          const collectionsJson =
            await collectionsResponse.json();

          const homeCollections = (
            (collectionsJson.data || []) as HomeCollection[]
          ).slice(0, 4);

          setCollections(homeCollections);

          preloadImages(
            homeCollections.map((collection) =>
              getImageUrl(
                collection.image_url,
                collection.object_key,
              ),
            ),
          );
        } else {
          setCollections([]);
        }
      } catch (error) {
        console.error(
          "Failed to load home page data:",
          error,
        );

        setHomeProducts([]);
        setCollections([]);
      } finally {
        setLoadingHomeData(false);
      }
    };

    void fetchHomeData();
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                              Countdown timer                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setCurrentTime(Date.now());

    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                             Automatic slider                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentSlide(
        (previousSlide) =>
          (previousSlide + 1) % heroSlides.length,
      );
    }, 6000);

    return () => {
      window.clearInterval(timer);
    };
  }, [heroSlides.length]);

  useEffect(() => {
    if (
      heroSlides.length > 0 &&
      currentSlide >= heroSlides.length
    ) {
      setCurrentSlide(0);
    }
  }, [currentSlide, heroSlides.length]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ------------------------------------------------------------------ */}
      {/*                            Hero slider                             */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-neutral-950">
        {heroSlides.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
            <div className="container mx-auto px-4 text-center">
              <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[32px] border border-white/15 bg-white/[0.08] px-6 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150 sm:px-10">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Wild Soul Club
                </p>

                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl lg:text-7xl">
                  New collections are coming
                </h1>

                <p className="mt-4 max-w-lg text-base leading-relaxed text-white/65 md:text-lg">
                  Add a featured or new-drop product in
                  Supabase to display it in this hero
                  slider.
                </p>

                <Link href="/products" className="mt-8">
                  <Button
                    size="lg"
                    className="rounded-full border border-white/20 bg-white/15 px-8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl hover:bg-white/25"
                  >
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          heroSlides.map((slide, index) => {
            const isActive = index === currentSlide;

            const countdownStatus =
              currentTime === null
                ? null
                : getCountdownStatus(
                    slide.startDate,
                    slide.endDate,
                    currentTime,
                  );

            const buttonLabel =
              countdownStatus?.state === "upcoming"
                ? "Preview Drop"
                : countdownStatus?.state === "ended"
                  ? "View Product"
                  : "Shop Live";

            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                className={`absolute inset-0 transition-all duration-1000 ease-out ${
                  isActive
                    ? "visible scale-100 opacity-100"
                    : "invisible scale-[1.03] opacity-0"
                }`}
              >
                {/* Background product image */}
                {slide.image ? (
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={index === 0}
                    unoptimized
                    sizes="100vw"
                    className={`object-cover transition-transform duration-[7000ms] ease-out ${
                      isActive
                        ? "scale-105"
                        : "scale-100"
                    }`}
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-900" />
                )}

                {/* Dark image overlays */}
                <div className="absolute inset-0 bg-black/25" />

                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/65" />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_5%,rgba(0,0,0,0.42)_100%)]" />

                {/* Center content */}
                <div className="relative z-10 flex h-full items-center justify-center">
                  <div className="container mx-auto px-4">
                    <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 text-center sm:gap-4">
                      {/* Subtitle */}
                      <div
                        className={`relative overflow-hidden rounded-full border border-white/20 bg-white/[0.1] px-5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-700 ${
                          isActive
                            ? "translate-y-0 opacity-100"
                            : "translate-y-4 opacity-0"
                        }`}
                      >
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
                        />

                        <p className="relative text-[10px] font-semibold uppercase tracking-[0.28em] text-white/80 sm:text-xs">
                          {slide.subtitle}
                        </p>
                      </div>

                      {/* Product title */}
                      <div
                        className={`relative overflow-hidden rounded-[28px] border border-white/20 bg-white/[0.09] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_25px_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl backdrop-saturate-150 transition-all delay-100 duration-700 sm:rounded-[36px] sm:px-10 sm:py-7 ${
                          isActive
                            ? "translate-y-0 opacity-100"
                            : "translate-y-5 opacity-0"
                        }`}
                      >
                        {/* Liquid glass reflection */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -left-1/4 -top-1/2 h-full w-[150%] rotate-[-8deg] bg-gradient-to-b from-white/20 via-white/[0.03] to-transparent blur-2xl"
                        />

                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
                        />

                        <h1 className="relative max-w-3xl text-balance text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)] sm:text-5xl md:text-7xl lg:text-8xl">
                          {slide.title}
                        </h1>
                      </div>

                      {/* Countdown */}
                      <div
                        className={`transition-all delay-200 duration-700 ${
                          isActive
                            ? "translate-y-0 opacity-100"
                            : "translate-y-5 opacity-0"
                        }`}
                      >
                        <HeroCountdown
                          startDate={slide.startDate}
                          endDate={slide.endDate}
                          currentTime={currentTime}
                        />
                      </div>

                      {/* Live button */}
                      <div
                        className={`transition-all delay-300 duration-700 ${
                          isActive
                            ? "translate-y-0 opacity-100"
                            : "translate-y-5 opacity-0"
                        }`}
                      >
                        <Link
                          href={slide.href}
                          tabIndex={isActive ? 0 : -1}
                        >
                          <Button
                            size="lg"
                            className="group h-12 rounded-full border border-white/25 bg-white/[0.14] px-7 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 transition-all hover:scale-[1.03] hover:border-white/40 hover:bg-white/[0.24] active:scale-[0.98] sm:h-14 sm:px-9"
                          >
                            {countdownStatus?.state ===
                              "live" && (
                              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                            )}

                            {buttonLabel}

                            <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Slider indicators */}
        {heroSlides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/10 px-3 py-2 shadow-lg backdrop-blur-2xl sm:bottom-8">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={
                  index === currentSlide
                    ? "true"
                    : undefined
                }
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === currentSlide
                    ? "w-8 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*                  Floating featured products                       */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative overflow-hidden bg-[#f7f7f5] py-16 md:py-24">
        {/* Soft editorial background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 blur-3xl" />

          <div className="absolute left-[10%] top-[15%] h-56 w-56 rounded-full bg-black/[0.025] blur-3xl" />

          <div className="absolute bottom-[10%] right-[8%] h-72 w-72 rounded-full bg-black/[0.02] blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-[1600px] px-4 md:px-8">
          {/* Section heading */}
          {/* <div className="relative z-30 mx-auto mb-8 flex max-w-xl flex-col items-center text-center md:mb-4">
            <span className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-black/40">
              Selected pieces
            </span>

            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-black md:text-5xl">
              Featured Products
            </h2>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-black/45 md:text-base">
              Explore featured pieces from our latest drops
              and archive collections.
            </p>
          </div> */}

          {loadingHomeData ? (
            <div className="flex min-h-[620px] items-center justify-center md:min-h-[760px]">
              <Card className="border-black/5 bg-white/60 shadow-none backdrop-blur-xl">
                <CardContent className="px-8 py-6 text-center text-sm text-black/45">
                  Loading products and images…
                </CardContent>
              </Card>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="flex min-h-[620px] items-center justify-center md:min-h-[760px]">
              <Card className="border-black/5 bg-white/60 shadow-none backdrop-blur-xl">
                <CardContent className="px-8 py-6 text-center text-sm text-black/45">
                  No featured products found in the database
                  yet.
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="relative h-[820px] w-full sm:h-[900px] md:h-[760px] lg:h-[820px]">
              {featuredProducts.map((product, index) => {
                const layout =
                  floatingProductLayouts[
                    index % floatingProductLayouts.length
                  ];

                const status =
                  getProductDisplayStatus(product);

                const productImage =
                  getProductImage(product) ||
                  "/images/placeholder.svg";

                return (
                  <div
                    key={product.id}
                    className={`
                      absolute
                      ${layout.mobile}
                      ${layout.desktop}
                    `}
                    style={{
                      zIndex: 10 + (index % 4),
                    }}
                  >
                    <div
                      className="floating-product-item"
                      style={
                        {
                          "--float-delay": layout.delay,
                          "--float-duration": layout.duration,
                          "--product-rotation":
                            layout.rotation,
                        } as React.CSSProperties
                      }
                    >
                      <Link
                        href={`/products/${
                          product.slug || product.id
                        }`}
                        aria-label={`View ${product.name}`}
                        className="group relative block"
                      >
                        {/* Product image */}
                        <div
                          className={`
                            relative aspect-square w-full
                            transition-all duration-700
                            ease-[cubic-bezier(0.22,1,0.36,1)]
                            group-hover:z-40
                            group-hover:scale-[1.10]
                            ${
                              status?.unavailable
                                ? "opacity-65 grayscale-[20%]"
                                : ""
                            }
                          `}
                        >
                          <Image
                            src={productImage}
                            alt={product.name}
                            fill
                            unoptimized
                            sizes="(min-width: 768px) 20vw, 42vw"
                            className="
                              object-contain
                              drop-shadow-[0_22px_25px_rgba(0,0,0,0.13)]
                              transition-all duration-700
                              ease-[cubic-bezier(0.22,1,0.36,1)]
                              group-hover:-translate-y-2
                              group-hover:drop-shadow-[0_35px_35px_rgba(0,0,0,0.18)]
                            "
                          />

                          {/* Tiny status */}
                          {status && (
                            <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-black/65 opacity-0 shadow-sm backdrop-blur-xl transition-opacity duration-300 group-hover:opacity-100 md:text-[10px]">
                              {status.label}
                            </span>
                          )}
                        </div>

                        {/* Hover product information */}
                        <div
                          className="
                            pointer-events-none
                            absolute left-1/2 top-full
                            z-50
                            mt-1
                            w-max max-w-[190px]
                            -translate-x-1/2
                            translate-y-2
                            rounded-2xl
                            border border-black/[0.06]
                            bg-white/80
                            px-4 py-3
                            text-center
                            opacity-0
                            shadow-[0_16px_45px_rgba(0,0,0,0.09)]
                            backdrop-blur-2xl
                            transition-all duration-300
                            group-hover:translate-y-0
                            group-hover:opacity-100
                          "
                        >
                          <p className="line-clamp-1 text-xs font-medium text-black/80">
                            {product.name}
                          </p>

                          <div className="mt-1 flex items-center justify-center gap-2">
                            {product.sale_price ? (
                              <>
                                <span className="text-[11px] font-semibold text-black">
                                  {Number(
                                    product.sale_price,
                                  ).toLocaleString()}
                                </span>

                                <span className="text-[10px] text-black/35 line-through">
                                  {Number(
                                    product.price,
                                  ).toLocaleString()}
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] font-semibold text-black">
                                {Number(
                                  product.price,
                                ).toLocaleString()}
                              </span>
                            )}

                            <span className="text-[9px] uppercase tracking-wider text-black/35">
                              MMK
                            </span>
                          </div>

                          <ArrowUpRight className="mx-auto mt-2 h-3.5 w-3.5 text-black/40" />
                        </div>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Shop all button */}
          <div className="relative z-30 mt-4 flex items-center justify-center md:mt-0">
            <Link href="/products">
              <Button
                variant="outline"
                size="lg"
                className="
                  group
                  rounded-full
                  border-black/10
                  bg-white/65
                  px-7
                  text-black
                  shadow-[0_14px_40px_rgba(0,0,0,0.06)]
                  backdrop-blur-xl
                  transition-all
                  hover:-translate-y-1
                  hover:border-black/20
                  hover:bg-white
                "
              >
                Shop All

                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*                              Collections                           */}
      {/* ------------------------------------------------------------------ */}

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold md:text-3xl">
              Collections
            </h2>

            <Link href="/collections">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {loadingHomeData ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Loading collections…
                </CardContent>
              </Card>
            ) : collections.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No active collections found in the
                  database yet.
                </CardContent>
              </Card>
            ) : (
              collections.map((collection) => {
                const collectionImage = getImageUrl(
                  collection.image_url,
                  collection.object_key,
                );

                return (
                  <Link
                    key={collection.id}
                    href={`/collections/${collection.slug}`}
                  >
                    <Card className="group overflow-hidden border-0">
                      <CardContent className="relative aspect-[3/4] bg-muted p-0">
                        {collectionImage ? (
                          <Image
                            src={collectionImage}
                            alt={collection.name}
                            fill
                            unoptimized
                            sizes="(min-width: 768px) 25vw, 50vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-muted" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-lg font-semibold text-white">
                            {collection.name}
                          </h3>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*                              Banner CTA                            */}
      {/* ------------------------------------------------------------------ */}

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[32px] border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center md:p-16">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Join the Wild Soul Club
              </h2>

              <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
                Sign up for exclusive drops, early
                access, and members-only pricing.
              </p>

              <div className="flex justify-center gap-3">
                <Link href="/sign-up">
                  <Button size="lg">Get Started</Button>
                </Link>

                <Link href="/collections">
                  <Button size="lg" variant="outline">
                    Explore
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}