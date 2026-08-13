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
      label: "Live Now",
      countdown: null,
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
    return null;
  }

  const status = getCountdownStatus(
    startDate,
    endDate,
    currentTime,
  );
  const countdown =
    status.state === "upcoming"
      ? status.countdown
      : null;

  const showCollectionCta =
    status.state === "live" || status.state === "ended";

  if (!countdown && !showCollectionCta) {
    return null;
  }

  return (
    <div
      className="
        relative z-10
        mx-auto flex w-full
        flex-col items-center
        gap-2.5 px-3
        overflow-visible
        min-[360px]:px-4
        sm:max-w-xl sm:gap-4
        md:max-w-2xl
      "
    >
      {countdown && (
        <div
          className="
            relative w-full
            max-w-[22rem]
            overflow-hidden
            rounded-2xl
            border border-white/20
            bg-white/[0.09]
            px-2 py-2.5
            shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_18px_60px_rgba(0,0,0,0.25)]
            backdrop-blur-2xl
            backdrop-saturate-150
            min-[360px]:max-w-[24rem]
            min-[360px]:px-3
            min-[400px]:px-4
            sm:max-w-[30rem]
            sm:rounded-[24px]
            sm:px-6 sm:py-4
          "
        >
          <div
            className="
              grid w-full
              grid-cols-4
              items-center
              divide-x divide-white/15
            "
          >
            <CountdownUnit value={countdown.days} label="Days" />
            <CountdownUnit value={countdown.hours} label="Hours" />
            <CountdownUnit value={countdown.minutes} label="Mins" />
            <CountdownUnit value={countdown.seconds} label="Secs" />
          </div>
        </div>
      )}

      {showCollectionCta && (
        <div className="flex min-h-10 w-full items-center justify-center sm:min-h-11">
          <Link
            href={href}
            className="
              inline-flex min-h-9
              items-center justify-center
              rounded-full
              border border-white/35
              bg-white
              px-4 py-2
              text-[11px] font-bold
              uppercase leading-none
              tracking-[0.14em]
              text-black
              shadow-lg
              transition-transform duration-300
              hover:scale-105
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-white
              focus-visible:ring-offset-2
              focus-visible:ring-offset-black
              motion-reduce:transition-none
              min-[360px]:px-5
              min-[360px]:text-xs
              sm:min-h-10
              sm:px-7 sm:py-2.5
              sm:text-sm
              sm:tracking-[0.16em]
            "
          >
            {status.state === "live"
              ? "LIVE NOW"
              : "LIVE NOW"}
          </Link>
        </div>
      )}
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

  const [revealedHeroId, setRevealedHeroId] = useState<
    string | null
  >(null);

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

  useEffect(() => {
    setRevealedHeroId(null);
  }, [currentSlide]);

  return (
    <div className="bg-white">
      {/* ------------------------------------------------------------------ */}
      {/*                            Hero slider                             */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative h-[calc(100svh-env(safe-area-inset-bottom))] min-h-0 w-full overflow-hidden bg-white">
        {heroSlides.length === 0 ? (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white"
          >
            <span
              aria-hidden="true"
              className="h-16 w-16 animate-spin rounded-full border-[6px] border-neutral-200 border-t-black sm:h-20 sm:w-20 sm:border-[7px] motion-reduce:animate-pulse"
            />
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-700 sm:text-base">
              {loadingHomeData
                ? "Loading featured collection"
                : "Loading collections"}
            </p>
          </div>
        ) : (
          heroSlides.map((slide, index) => {
            const isActive = index === currentSlide;
            const isHeroStatusVisible =
              isActive && revealedHeroId === slide.id;

            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                aria-label={`${slide.subtitle} collection`}
                inert={!isActive}
                className={`absolute inset-0 bg-white transition-all duration-1000 ease-out ${!slide.image ? "[&_h1]:!text-foreground" : ""} ${
                  isActive
                    ? "visible scale-100 opacity-100"
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
                ) : null}

                {/* Dark image overlays */}
                {slide.image ? (
                  <>
                    {/* <div className="absolute inset-0 bg-black/25" /> */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/4 to-black/25" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(0, 0, 0, 0.01)_100%)]" />
                  </>
                ) : null}

                {/* Center content */}
                <div className="relative z-10 flex h-full items-center justify-center px-[env(safe-area-inset-left)] pb-[max(1rem,env(safe-area-inset-bottom))] pt-[var(--site-header-height)]">
                  <div className="container mx-auto px-4">
                    <div
                      className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 text-center landscape:gap-2 sm:gap-4"
                      onPointerLeave={() => {
                        setRevealedHeroId(null);
                        setIsHeroInteractionActive(false);
                      }}
                      onFocusCapture={() => {
                        setRevealedHeroId(slide.id);
                        setIsHeroInteractionActive(true);
                      }}
                      onBlurCapture={(event) => {
                        const nextFocusedElement =
                          event.relatedTarget as Node | null;

                        if (
                          !event.currentTarget.contains(
                            nextFocusedElement,
                          )
                        ) {
                          setRevealedHeroId(null);
                          setIsHeroInteractionActive(false);
                        }
                      }}
                    >
                      {/* Collection name: hover, focus, or tap to reveal status */}
                      <button
                        type="button"
                        aria-label={`Reveal status for ${slide.title}`}
                        aria-expanded={isHeroStatusVisible}
                        onPointerEnter={() => {
                          setRevealedHeroId(slide.id);
                          setIsHeroInteractionActive(true);
                        }}
                        onClick={() => {
                          setRevealedHeroId(slide.id);
                          setIsHeroInteractionActive(true);
                        }}
                        className={`
                          relative mx-auto max-w-lg overflow-hidden
                          rounded-xl border border-white/15
                          bg-white/[0.09] px-3 py-2.5
                          shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_12px_36px_rgba(0,0,0,0.22)]
                          backdrop-blur-2xl backdrop-saturate-150
                          transition-all delay-100 duration-700
                          hover:scale-[1.02]
                          focus-visible:outline-none
                          focus-visible:ring-2
                          focus-visible:ring-white
                          focus-visible:ring-offset-2
                          focus-visible:ring-offset-black/40
                          sm:max-w-xl sm:rounded-2xl sm:px-5 sm:py-3
                          ${
                            isActive
                              ? "translate-y-0 opacity-100"
                              : "translate-y-5 opacity-0"
                          }
                        `}
                      >
                        {/* Liquid glass reflection */}
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -left-1/4 -top-1/2 h-full w-[150%] rotate-[-8deg] bg-gradient-to-b from-white/20 via-white/[0.03] to-transparent blur-2xl"
                        />

                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
                        />

                        <h1 className="relative text-balance text-[clamp(1rem,3.5vmin,2.2rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)]">
                          {slide.title}
                        </h1>
                      </button>

                      {/* Upcoming = countdown. Live and ended = collection link. */}
                      <div
                        aria-hidden={!isHeroStatusVisible}
                        inert={!isHeroStatusVisible}
                        className={`
                          overflow-hidden transition-all
                          delay-100 duration-500
                          ${
                            isHeroStatusVisible
                              ? "max-h-40 translate-y-0 opacity-100"
                              : "pointer-events-none max-h-0 translate-y-2 opacity-0"
                          }
                        `}
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
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 shadow-lg backdrop-blur-2xl sm:bottom-8">
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

        {/* ------------------------------------------------------------------ */}
        {/*                       Hero bottom information                       */}
        {/* ------------------------------------------------------------------ */}

        <div
          className={`
            absolute bottom-0 left-0 right-0 z-30
            px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]
            text-[10px] font-medium tracking-[0.04em]
            sm:px-6 sm:pb-4 sm:text-[11px]
            md:px-8
            ${
              heroSlides.length > 0
                ? "text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
                : "text-neutral-700"
            }
          `}
        >
          {/* <div
            className="
              mx-auto grid w-full
              grid-cols-1 items-end
              gap-1.5
              sm:grid-cols-[1fr_2fr_1fr]
              sm:gap-4
            "
          >
            
            <div className="flex items-center justify-center sm:justify-start">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/90 shadow-sm sm:h-10 sm:w-10">
                <Image
                  src="/images/logo-black.png"
                  alt="Wild Soul Club"
                  width={162}
                  height={162}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            
            <div className="text-center opacity-80">
              <span>
                Myanmar streetwear offering original pieces,
                limited collections and new drops.
              </span>
            </div>

            
            <div className="flex items-center justify-center gap-3 sm:justify-end">
              <Link
                href="/privacy"
                className="transition-opacity hover:opacity-60"
              >
                Privacy
              </Link>

              <span
                aria-hidden="true"
                className="opacity-40"
              >
                ·
              </span>

              <Link
                href="/terms"
                className="transition-opacity hover:opacity-60"
              >
                Terms
              </Link>
            </div>
          </div> */}
        </div>
      </section>
    </div>
  );
}
