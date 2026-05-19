import { cn } from "@/lib/utils";

const SIZE = { sm: "size-4", md: "size-6", lg: "size-10" } as const;

export function LoadingSpinner({
  size = "md",
  className,
  label,
}: {
  size?: keyof typeof SIZE;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={cn("inline-flex items-center gap-2 text-ink-muted", className)}
    >
      <span
        className={cn(
          "rounded-full border-2 border-primary-200 border-t-primary-500 animate-spin",
          SIZE[size],
        )}
      />
      {label ? <span className="text-sm">{label}</span> : null}
    </span>
  );
}
