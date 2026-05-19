import { Skeleton } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 rounded-full" />
      </div>
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, s) => (
          <section key={s}>
            <Skeleton className="h-5 w-40 mb-3" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
