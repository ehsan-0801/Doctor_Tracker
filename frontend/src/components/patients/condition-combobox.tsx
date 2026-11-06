"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { patientsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { cn } from "@/lib/utils";

/**
 * Pick a known condition (presets + values already stored) or type a new one.
 * The API normalizes casing, so "diabetes" and "Diabetes" are stored identically.
 */
export function ConditionCombobox({
  id,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const conditions = useQuery({ queryKey: queryKeys.patients.conditions, queryFn: patientsApi.conditions, staleTime: 5 * 60_000 });

  const typed = query.trim().replace(/\s+/g, " ");
  const exactMatch = conditions.data?.some((c) => c.toLowerCase() === typed.toLowerCase());

  const select = (next: string) => {
    onChange(next);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn("h-10 w-full justify-between px-3 font-normal", !value && "text-muted-foreground")}
        >
          <span className="truncate">{value || "Select or type a condition"}</span>
          <ChevronsUpDown className="text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search or add condition…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>{conditions.isLoading ? "Loading…" : "No matching condition."}</CommandEmpty>
            {typed.length >= 2 && !exactMatch && (
              <CommandGroup heading="Custom">
                <CommandItem value={`__custom__${typed}`} onSelect={() => select(typed)}>
                  <Plus aria-hidden />
                  Use “{typed}”
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Conditions">
              {conditions.data?.map((condition) => (
                <CommandItem key={condition} value={condition} onSelect={() => select(condition)}>
                  <Check className={cn(value.toLowerCase() === condition.toLowerCase() ? "opacity-100" : "opacity-0")} aria-hidden />
                  {condition}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
