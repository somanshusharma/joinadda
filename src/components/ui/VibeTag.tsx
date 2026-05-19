import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-primary-100 text-primary-700",
  "bg-accent-100 text-amber-800",
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
];

function colorFor(label: string) {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function VibeTag({
  label,
  active,
  onClick,
  className,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition",
        active
          ? "bg-primary-500 text-white shadow-sm"
          : colorFor(label),
        onClick && "hover:opacity-90",
        className,
      )}
    >
      {label}
    </Tag>
  );
}
