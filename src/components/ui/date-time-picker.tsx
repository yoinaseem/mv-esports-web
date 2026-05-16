"use client";

import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Clock01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateTimePickerProps = {
  // Local-time ISO 8601 string without offset (YYYY-MM-DDTHH:mm) or null.
  // Backend Carbon parses this in the app timezone — same as the existing
  // datetime-local input shape we used to send.
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseLocalDateTime(value: string | null): { date: Date | undefined; time: string } {
  if (!value) return { date: undefined, time: "" };
  // Expect YYYY-MM-DDTHH:mm (no offset). Tolerant of trailing seconds + Z.
  const [datePart, timePartRaw] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const date = y && m && d ? new Date(y, m - 1, d) : undefined;
  let time = "";
  if (timePartRaw) {
    const [hh, mm] = timePartRaw.replace(/Z$/, "").split(":");
    if (hh != null && mm != null) time = `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}`;
  }
  return { date, time };
}

function toLocalIso(date: Date, time: string): string {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  return `${yyyy}-${mm}-${dd}T${t}`;
}

export function DateTimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Pick a date and time",
  className,
  id,
}: DateTimePickerProps) {
  const { date, time } = parseLocalDateTime(value);

  const display = date ? `${format(date, "PPP")}${time ? ` · ${time}` : ""}` : placeholder;

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) {
      onChange(null);
      return;
    }
    // Preserve the existing time when the user picks a new date.
    onChange(toLocalIso(d, time || "00:00"));
  };

  const handleTimeChange = (next: string) => {
    if (!date) {
      // No date yet — choose today as a sensible default and combine.
      onChange(toLocalIso(new Date(), next));
      return;
    }
    onChange(toLocalIso(date, next));
  };

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
          {display}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={handleDateSelect} />
        <div className="border-t border-border p-3">
          <Label htmlFor={`${id ?? "dt"}-time`} className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5" />
            Time
          </Label>
          <Input
            id={`${id ?? "dt"}-time`}
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
