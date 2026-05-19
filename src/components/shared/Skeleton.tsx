import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-surface-muted",
        className,
      )}
    />
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-full" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-surface-border bg-surface-elevated p-6 soft-shadow"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="mt-4 h-4 w-full rounded-full" />
          <Skeleton className="mt-2 h-4 w-4/5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-surface-border bg-surface-elevated overflow-hidden"
        >
          <Skeleton className="h-56 rounded-none" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-3/4 rounded-full" />
            <Skeleton className="h-3 w-1/2 rounded-full" />
            <Skeleton className="mt-4 h-10 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
