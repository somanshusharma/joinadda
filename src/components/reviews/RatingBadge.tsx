import { cn } from "@/lib/utils";

/**
 * Compact rating chip for cards. Renders nothing if no reviews.
 */
export function RatingBadge({
  rating,
  count,
  size = "sm",
  className,
}: {
  rating: number | null | undefined;
  count: number | null | undefined;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  if (!rating || !count) return null;
  const dims =
    size === "xs"
      ? "text-[11px] gap-0.5"
      : size === "md"
        ? "text-sm gap-1"
        : "text-xs gap-1";
  const iconSize = size === "xs" ? 12 : size === "md" ? 16 : 14;
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold text-ink",
        dims,
        className,
      )}
    >
      <span
        className="material-symbols-outlined text-mango-500"
        style={{
          fontSize: `${iconSize}px`,
          fontVariationSettings: "'FILL' 1",
        }}
      >
        star
      </span>
      {Number(rating).toFixed(1)}
      <span className="text-ink-muted font-normal">({count})</span>
    </span>
  );
}
