"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { doctorsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { cn } from "@/lib/utils";

export interface DoctorChoice {
  _id: string;
  name: string;
}

/** Server-searched doctor picker (bounded results, never loads every doctor). */
export function DoctorCombobox({
  id,
  value,
  onChange,
  placeholder = "Select a doctor",
  extraOptions = [],
  invalid,
  describedBy,
  className,
}: {
  id: string;
  value: DoctorChoice | null;
  onChange: (value: DoctorChoice | null) => void;
  placeholder?: string;
  /** Static options listed first, e.g. "All doctors" or "Unassigned". */
  extraOptions?: DoctorChoice[];
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 250);
  const options = useQuery({
    queryKey: queryKeys.doctors.options(debounced),
    queryFn: () => doctorsApi.options(debounced),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const select = (choice: DoctorChoice | null) => {
    onChange(choice);
    setOpen(false);
    setSearch("");
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
          className={cn("h-10 w-full justify-between bg-card px-3 font-normal", !value && "text-muted-foreground", className)}
        >
          <span className="truncate">{value?.name ?? placeholder}</span>
          <ChevronsUpDown className="text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search doctors…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{options.isFetching ? "Searching…" : "No doctors found."}</CommandEmpty>
            {extraOptions.length > 0 && !debounced && (
              <CommandGroup>
                {extraOptions.map((option) => (
                  <CommandItem key={option._id} value={option._id} onSelect={() => select(option._id ? option : null)}>
                    <Check className={cn((value?._id ?? "") === option._id ? "opacity-100" : "opacity-0")} aria-hidden />
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading="Doctors">
              {options.data?.map((doctor) => (
                <CommandItem key={doctor._id} value={doctor._id} onSelect={() => select({ _id: doctor._id, name: doctor.name })}>
                  <Check className={cn(value?._id === doctor._id ? "opacity-100" : "opacity-0")} aria-hidden />
                  <span className="truncate">{doctor.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{doctor.specialization}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
