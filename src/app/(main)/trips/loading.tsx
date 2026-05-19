import { CardGridSkeleton, Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-80 rounded-full" />
      </div>
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      <CardGridSkeleton />
    </div>
  );
}
