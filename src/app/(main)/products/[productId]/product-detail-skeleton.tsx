import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailSkeleton() {
  const skeletonClass = "bg-neutral-200 motion-reduce:animate-none";

  return (
    <div
      className="min-h-screen overflow-x-clip bg-white py-5 md:-mt-[var(--site-header-height)] md:h-svh md:min-h-0 md:overflow-hidden md:px-4 md:pb-4 md:pt-[calc(var(--site-header-height)+1.5rem)] lg:mt-0 lg:h-svh lg:min-h-0 lg:overflow-hidden lg:p-0"
      role="status"
      aria-label="Loading product"
    >
      <div className="container mx-auto max-w-[1300px] lg:max-w-none">
        <div className="grid grid-cols-1 items-start gap-7 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.58fr)] lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] lg:gap-12">
          <Skeleton
            className={`${skeletonClass} aspect-[4/5] min-h-[480px] w-full rounded-[1.75rem] sm:min-h-[560px] md:aspect-auto md:h-[calc(100svh-var(--site-header-height)-5.5rem)] md:min-h-[580px] md:max-h-[1080px] lg:h-svh lg:min-h-0 lg:max-h-none lg:rounded-none`}
          />

          <div className="relative z-20 mx-4 w-[calc(100%-2rem)] rounded-[1.75rem] border border-black/10 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-5 md:mx-0 md:w-full md:max-w-[440px] md:justify-self-end md:p-5 lg:mr-8 lg:max-h-[calc(100svh-var(--site-header-height)-2rem)] lg:max-w-none lg:self-center lg:overflow-y-auto lg:overscroll-contain">
            <Skeleton className={`${skeletonClass} mb-2 h-2.5 w-24`} />
            <Skeleton className={`${skeletonClass} mb-2 h-7 w-4/5`} />
            <Skeleton className={`${skeletonClass} mb-4 h-7 w-28`} />

            <div className="mb-3">
              <Skeleton className={`${skeletonClass} mb-2 h-4 w-14`} />
              <div className="flex gap-2">
                {["size-1", "size-2", "size-3", "size-4"].map((key) => (
                  <Skeleton key={key} className={`${skeletonClass} h-11 w-12 rounded-xl`} />
                ))}
              </div>
            </div>

            <div className="mb-3">
              <Skeleton className={`${skeletonClass} mb-2 h-4 w-16`} />
              <div className="flex gap-2">
                {["color-1", "color-2", "color-3"].map((key) => (
                  <Skeleton key={key} className={`${skeletonClass} h-11 w-20 rounded-xl`} />
                ))}
              </div>
            </div>

            <div className="mb-3">
              <Skeleton className={`${skeletonClass} mb-2 h-4 w-20`} />
              <div className="flex items-center gap-2">
                <Skeleton className={`${skeletonClass} h-11 w-11 rounded-xl`} />
                <Skeleton className={`${skeletonClass} h-4 w-7`} />
                <Skeleton className={`${skeletonClass} h-11 w-11 rounded-xl`} />
                <Skeleton className={`${skeletonClass} ml-2 h-4 w-24`} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Skeleton className={`${skeletonClass} h-11 w-full rounded-xl`} />
              <Skeleton className={`${skeletonClass} h-11 w-full rounded-xl sm:w-32`} />
            </div>

            <div className="mt-3 border-t border-foreground/10">
              {["description", "size-chart"].map((key) => (
                <div key={key} className="flex min-h-12 items-center justify-between border-b border-foreground/10 py-3 last:border-b-0">
                  <Skeleton className={`${skeletonClass} h-4 w-28`} />
                  <Skeleton className={`${skeletonClass} h-4 w-4`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
