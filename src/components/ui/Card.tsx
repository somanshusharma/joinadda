import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-surface-border bg-surface-elevated p-5 shadow-sm",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
