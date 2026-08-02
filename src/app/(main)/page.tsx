"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
  href,
}: {
  startDate: string | null;
  endDate: string | null;
  currentTime: number | null;
  href: string;
}) {
  if (currentTime === null) {
    return (
      <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-white/[0.09] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150">
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

  if (!status.countdown) {
    if (status.state === "ended") return null;

    return (
      <Link
        href={href}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/35 bg-white px-6 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-black shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black motion-reduce:transition-none"
      >
        Live
      </Link>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-white/[0.09] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 sm:px-6 sm:py-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
      />

      <div className="relative flex flex-col items-center">
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
  const [isHeroInteractionActive, setIsHeroInteractionActive] =
    useState(false);

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
      .slice(0, 1)
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
    if (heroSlides.length <= 1 || isHeroInteractionActive) {
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
  }, [heroSlides.length, isHeroInteractionActive]);

  useEffect(() => {
    if (
      heroSlides.length > 0 &&
      currentSlide >= heroSlides.length
    ) {
      setCurrentSlide(0);
    }
  }, [currentSlide, heroSlides.length]);

  return (
    <div className="bg-background">
      {/* ------------------------------------------------------------------ */}
      {/*                            Hero slider                             */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative h-[calc(100svh-env(safe-area-inset-bottom))] min-h-0 w-full overflow-hidden bg-neutral-950">
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
              </div>
            </div>
          </div>
        ) : (
          heroSlides.map((slide, index) => {
            const isActive = index === currentSlide;

            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                aria-label={`${slide.subtitle} collection. Reveal countdown.`}
                inert={!isActive}
                tabIndex={isActive ? 0 : -1}
                onPointerEnter={() => setIsHeroInteractionActive(true)}
                onPointerLeave={() => setIsHeroInteractionActive(false)}
                onFocus={() => setIsHeroInteractionActive(true)}
                onBlur={() => setIsHeroInteractionActive(false)}
                className={`absolute inset-0 transition-all duration-1000 ease-out ${
                  isActive
                    ? "group visible scale-100 opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                    : "pointer-events-none invisible scale-[1.03] opacity-0"
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
                <div className="relative z-10 flex h-full items-center justify-center px-[env(safe-area-inset-left)] pb-[max(1rem,env(safe-area-inset-bottom))] pt-[var(--site-header-height)]">
                  <div className="container mx-auto px-4">
                    <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 text-center landscape:gap-2 sm:gap-4">
                      {/* Collection name */}
                      <div
                        className={`
                          relative overflow-hidden 
                          rounded-2xl sm:rounded-3xl   /* was 28px → 16px (mobile), 36px → 24px (desktop) */
                          border border-white/20 
                          bg-white/[0.09] 
                          px-4 py-4 sm:px-8 sm:py-6    /* was px-5 py-5 / sm:px-10 sm:py-7 – now smaller */
                          shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_25px_80px_rgba(0,0,0,0.3)] 
                          backdrop-blur-2xl backdrop-saturate-150 
                          transition-all delay-100 duration-700 
                          max-w-2xl mx-auto           /* optional – limits width and centres on large screens */
                          ${isActive ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}
                        `}
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

                        <h1 className="relative text-balance text-[clamp(1rem,3.5vmin,2.2rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)]">
                            {slide.title}
                        </h1>
                      </div>

                      {/* Countdown */}
                      <div
                        className={`max-h-0 translate-y-2 overflow-hidden opacity-0 transition-all delay-100 duration-500 group-hover:max-h-32 group-hover:translate-y-0 group-hover:opacity-100 group-focus:max-h-32 group-focus:translate-y-0 group-focus:opacity-100 ${
                          isActive
                            ? ""
                            : "!max-h-0 !opacity-0"
                        }`}
                      >
                        <HeroCountdown
                          startDate={slide.startDate}
                          endDate={slide.endDate}
                          currentTime={currentTime}
                          href={slide.href}
                        />
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
    </div>
  );
}
