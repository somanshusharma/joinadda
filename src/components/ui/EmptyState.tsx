import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-16",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 text-primary-400 [&>svg]:size-12">{icon}</div>
      ) : null}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-xs text-sm text-ink-secondary leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
