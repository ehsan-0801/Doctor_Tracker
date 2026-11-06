"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { fieldAria, FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { doctorsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { applyApiErrors } from "@/lib/form-errors";
import { doctorSchema, type DoctorFormValues } from "@/lib/validations";

const EMPTY: DoctorFormValues = { name: "", specialization: "", hospital: "", phone: "", email: "" };
const FIELDS = Object.keys(EMPTY);

export function DoctorFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DoctorFormValues>({ resolver: zodResolver(doctorSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const doctor = await doctorsApi.create(values);
      toast.success(`${doctor.name} added`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
      ]);
      onOpenChange(false);
    } catch (error) {
      applyApiErrors(error, setError, FIELDS);
    }
  });

  const field = (name: keyof DoctorFormValues, label: string, props: React.ComponentProps<typeof Input> = {}) => {
    const id = `doctor-${name}`;
    const error = errors[name]?.message;
    return (
      <FormField id={id} label={label} error={error}>
        <Input {...fieldAria(id, error)} className="h-10" {...props} {...register(name)} />
      </FormField>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add doctor</DialogTitle>
          <DialogDescription>Create a doctor record. All fields are required.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {field("name", "Full name", { placeholder: "Dr. Jane Smith", autoComplete: "off" })}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("specialization", "Specialization", { placeholder: "Cardiology" })}
            {field("hospital", "Hospital", { placeholder: "City Hospital" })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("phone", "Phone", { type: "tel", placeholder: "+1 555 010 2030", autoComplete: "off" })}
            {field("email", "Email", { type: "email", placeholder: "doctor@hospital.com", autoComplete: "off" })}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              {isSubmitting ? "Saving…" : "Add doctor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
