import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileHeader({
  title,
  back,
  right,
  className,
}: {
  title: string;
  back?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "md:hidden flex items-center gap-2 -mx-4 px-4 mb-4 h-12",
        className,
      )}
    >
      {back ? (
        <Link
          href={back}
          className="grid place-items-center size-9 -ml-2 rounded-full hover:bg-surface-muted"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </Link>
      ) : null}
      <h1 className="text-lg font-semibold flex-1 truncate">{title}</h1>
      {right}
    </header>
  );
}
