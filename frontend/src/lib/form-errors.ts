import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";

/** Map API field errors onto the form; fall back to a toast. */
export function applyApiErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: readonly string[]) {
  if (error instanceof ApiError) {
    const fieldErrors = error.errors.filter((e) => e.field && fields.includes(e.field));
    for (const fieldError of fieldErrors) {
      setError(fieldError.field as Path<T>, { type: "server", message: fieldError.message });
    }
    if (fieldErrors.length === 0) toast.error(error.message);
    return;
  }
  toast.error("Something went wrong. Please try again.");
}
