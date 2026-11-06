/** Escape user input before using it inside a regular expression. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive "contains" matcher for search terms. */
export function containsPattern(term: string): RegExp {
  return new RegExp(escapeRegex(term), "i");
}

/** Inclusive createdAt range. `endDate` covers the whole calendar day. */
export function dateRangeFilter(startDate?: Date, endDate?: Date) {
  if (!startDate && !endDate) return undefined;
  const range: { $gte?: Date; $lte?: Date } = {};
  if (startDate) range.$gte = startDate;
  if (endDate) {
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return range;
}
