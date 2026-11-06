import { format, parseISO } from "date-fns";

export const formatDate = (iso: string) => format(parseISO(iso), "MMM d, yyyy");
export const formatMonth = (yyyyMm: string) => format(parseISO(`${yyyyMm}-01`), "MMM yyyy");
export const formatMonthShort = (yyyyMm: string) => format(parseISO(`${yyyyMm}-01`), "MMM");
export const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

export function initials(name: string) {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
