"use client";

import * as React from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SlantedDateRangeValue = {
  from: string | null;
  to: string | null;
};

type SlantedDateRangePickerProps = {
  value: SlantedDateRangeValue;
  onChange: (next: SlantedDateRangeValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

// Local-date parsing to avoid the `new Date('YYYY-MM-DD')` UTC trap that
// shifts dates by a day across timezones.
function toLocalDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toIsoDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatRangeLabel(
  value: SlantedDateRangeValue,
  placeholder: string,
): { label: string; isPlaceholder: boolean } {
  const fromDate = toLocalDate(value.from);
  const toDate = toLocalDate(value.to);
  if (fromDate && toDate) {
    return {
      label: `${format(fromDate, "MMM d")} → ${format(toDate, "MMM d")}`,
      isPlaceholder: false,
    };
  }
  if (fromDate) {
    return {
      label: `${format(fromDate, "MMM d")} → …`,
      isPlaceholder: false,
    };
  }
  return { label: placeholder, isPlaceholder: true };
}

export function SlantedDateRangePicker({
  value,
  onChange,
  placeholder = "ANY DATES",
  disabled,
  className,
  id,
}: SlantedDateRangePickerProps) {
  const range: DateRange | undefined =
    value.from || value.to
      ? {
          from: toLocalDate(value.from),
          to: toLocalDate(value.to),
        }
      : undefined;

  const handleSelect = (next: DateRange | undefined) => {
    if (!next) {
      onChange({ from: null, to: null });
      return;
    }
    onChange({
      from: next.from ? toIsoDate(next.from) : null,
      to: next.to ? toIsoDate(next.to) : null,
    });
  };

  const { label, isPlaceholder } = formatRangeLabel(value, placeholder);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "group relative inline-flex h-12 w-full items-center justify-between border-2 border-border bg-input/30 px-5 outline-none transition-colors",
            "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
            "data-[state=open]:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          style={{ transform: "skewX(-6deg)" }}
        >
          <span
            className="flex w-full items-center justify-between gap-2 text-sm uppercase tracking-wider"
            style={{ transform: "skewX(6deg)" }}
          >
            <span
              className={cn(isPlaceholder ? "text-muted-foreground" : undefined)}
            >
              {label}
            </span>
            <HugeiconsIcon
              icon={Calendar01Icon}
              className="size-4 text-muted-foreground"
            />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
