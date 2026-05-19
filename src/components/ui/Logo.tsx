import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-display font-extrabold tracking-tight text-primary-600",
        className,
      )}
    >
      <span className="inline-block size-6 rounded-full bg-primary-500 shadow-sm" />
      <span>{APP_NAME.toLowerCase()}</span>
    </span>
  );
}
