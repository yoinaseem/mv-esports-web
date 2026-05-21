"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

// Bare radix primitives that don't need styling.
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

// ----- Trigger ---------------------------------------------------------------

type SlantedSelectTriggerProps = React.ComponentProps<
  typeof SelectPrimitive.Trigger
>;

export function SlantedSelectTrigger({
  className,
  children,
  ...props
}: SlantedSelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="slanted-select-trigger"
      className={cn(
        "group relative inline-flex h-12 w-full items-center justify-between border-2 border-border bg-input/30 px-5 outline-none transition-colors",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
        "data-[state=open]:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{ transform: "skewX(-6deg)" }}
      {...props}
    >
      <span
        className="flex w-full items-center justify-between gap-2 text-sm uppercase tracking-wider"
        style={{ transform: "skewX(6deg)" }}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="size-4 text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180"
          />
        </SelectPrimitive.Icon>
      </span>
    </SelectPrimitive.Trigger>
  );
}

// ----- Content (Path A — tactical, no skew on the popover) -------------------

type SlantedSelectContentProps = React.ComponentProps<
  typeof SelectPrimitive.Content
>;

export function SlantedSelectContent({
  className,
  children,
  position = "popper",
  ...props
}: SlantedSelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="slanted-select-content"
        position={position}
        className={cn(
          "relative z-50 max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden border-2 border-border bg-popover text-popover-foreground shadow-lg",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

// ----- Item -----------------------------------------------------------------

type SlantedSelectItemProps = React.ComponentProps<typeof SelectPrimitive.Item>;

export function SlantedSelectItem({
  className,
  children,
  ...props
}: SlantedSelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="slanted-select-item"
      className={cn(
        "relative flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm uppercase tracking-wider outline-none transition-colors",
        "text-foreground/80",
        "data-[highlighted]:bg-primary/10 data-[highlighted]:text-foreground",
        "data-[state=checked]:bg-primary/15 data-[state=checked]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <HugeiconsIcon
          icon={Tick02Icon}
          strokeWidth={2.5}
          className="size-4 text-primary"
        />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

// ----- Backwards-compat aliases ----------------------------------------------
// Callers can still import `SelectContent` / `SelectItem` from this module so
// the filter list code doesn't need to change.
export { SlantedSelectContent as SelectContent };
export { SlantedSelectItem as SelectItem };
