import { Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-32 -mx-4 md:-mx-6 rounded-b-3xl rounded-t-none" />
      <div className="-mt-12 px-1">
        <Skeleton className="size-28 rounded-full" />
        <Skeleton className="mt-3 h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-32 rounded-full" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
