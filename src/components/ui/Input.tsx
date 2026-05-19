import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-2xl border border-surface-border bg-surface-elevated px-4 text-base text-ink placeholder:text-ink-muted focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200",
          className,
        )}
        {...rest}
      />
    );
  },
);

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-24 w-full rounded-2xl border border-surface-border bg-surface-elevated px-4 py-3 text-base text-ink placeholder:text-ink-muted focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none",
          className,
        )}
        {...rest}
      />
    );
  },
);
