"use client";

import { format, parseISO } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const toIso = (date: Date) => format(date, "yyyy-MM-dd");

export function DateRangeFilter({
  id,
  label,
  startDate,
  endDate,
  onChange,
}: {
  id: string;
  label: string;
  startDate: string | undefined;
  endDate: string | undefined;
  onChange: (range: { startDate?: string; endDate?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected: DateRange | undefined = startDate
    ? { from: parseISO(startDate), to: endDate ? parseISO(endDate) : undefined }
    : undefined;

  const text = startDate
    ? `${format(parseISO(startDate), "MMM d, yyyy")}${endDate && endDate !== startDate ? ` – ${format(parseISO(endDate), "MMM d, yyyy")}` : ""}`
    : "Any date";

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              className={cn("h-10 w-full justify-start bg-card px-3 font-normal", !startDate && "text-muted-foreground")}
            >
              <CalendarDays className="text-muted-foreground" aria-hidden />
              <span className="truncate pr-6">{text}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={selected}
              defaultMonth={selected?.from}
              numberOfMonths={1}
              disabled={{ after: new Date() }}
              onSelect={(range) =>
                onChange({
                  startDate: range?.from ? toIso(range.from) : undefined,
                  endDate: range?.to ? toIso(range.to) : range?.from ? toIso(range.from) : undefined,
                })
              }
            />
            <div className="flex justify-end gap-2 border-t p-2">
              <Button variant="ghost" size="sm" onClick={() => onChange({})} disabled={!startDate}>
                Reset
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {startDate && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
