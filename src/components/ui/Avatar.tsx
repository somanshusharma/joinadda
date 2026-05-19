import { cn, avatarColor, initials } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
const SIZE: Record<Size, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-28 text-2xl",
};

export function Avatar({
  src,
  name,
  seed,
  size = "md",
  className,
}: {
  src?: string | null;
  name: string;
  seed?: string;
  size?: Size;
  className?: string;
}) {
  if (src) {
    return (
      // Plain <img> — Supabase Storage hosts can be added to next.config later.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover", SIZE[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold",
        avatarColor(seed ?? name),
        SIZE[size],
        className,
      )}
      aria-label={name}
    >
      {initials(name) || "?"}
    </span>
  );
}
