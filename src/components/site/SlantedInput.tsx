"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SlantedInputProps = React.ComponentProps<"input"> & {
  containerClassName?: string;
};

export function SlantedInput({
  className,
  containerClassName,
  ...props
}: SlantedInputProps) {
  return (
    <div
      className={cn(
        "relative inline-flex h-12 w-full items-center border-2 border-border bg-input/30 px-5 transition-colors",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30",
        containerClassName,
      )}
      style={{ transform: "skewX(-6deg)" }}
    >
      <input
        {...props}
        className={cn(
          "w-full bg-transparent text-sm uppercase tracking-wider text-foreground outline-none",
          "placeholder:text-muted-foreground placeholder:tracking-wider",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        style={{ transform: "skewX(6deg)" }}
      />
    </div>
  );
}
