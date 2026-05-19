import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Inline "Sign up to {do thing}" CTA shown to guests in place of an action button.
 */
export function SignUpCta({
  label = "Sign up to join",
  size = "md",
  variant = "primary",
  next,
  className,
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline";
  next?: string;
  className?: string;
}) {
  const sizeCls =
    size === "lg" ? "h-12 px-6 text-sm" : size === "sm" ? "h-9 px-4 text-xs" : "h-11 px-5 text-sm";
  const variantCls =
    variant === "outline"
      ? "border border-surface-border text-ink-secondary hover:bg-surface-muted"
      : "bg-primary-500 text-white hover:bg-primary-600 sun-kissed-shadow";
  const href = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold transition-all active:scale-95",
        sizeCls,
        variantCls,
        className,
      )}
    >
      {label}
    </Link>
  );
}
