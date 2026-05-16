"use client";

import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = {
  // ISO date string (YYYY-MM-DD) or null. Caller owns parsing/serialising —
  // this component round-trips through the same shape so it can drop into a
  // form's value/onChange pipeline without timezone surprises.
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
};

function toLocalDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  // Parse YYYY-MM-DD as local-date (avoid the new Date('YYYY-MM-DD') UTC trap
  // which can shift the date by one day across timezones).
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

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = "Pick a date",
  className,
  id,
}: DatePickerProps) {
  const date = toLocalDate(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <HugeiconsIcon icon={Calendar01Icon} strokeWidth={1.75} />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? toIsoDate(d) : null)}
        />
      </PopoverContent>
    </Popover>
  );
}
