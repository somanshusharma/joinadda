import { Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72 rounded-full" />
      </div>
      <Skeleton className="h-10 w-60 rounded-full mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-3/4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
