"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { fieldAria, FormField } from "@/components/shared/form-field";
import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { doctorsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { applyApiErrors } from "@/lib/form-errors";
import { doctorSchema, type DoctorFormValues } from "@/lib/validations";
import type { Doctor } from "@/types/api";

const EMPTY: DoctorFormValues = { name: "", specialization: "", hospital: "", phone: "", email: "", qualifications: "", photoUrl: "" };
const FIELDS = Object.keys(EMPTY);

export function DoctorFormDialog({
  open,
  onOpenChange,
  doctor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing doctor. */
  doctor?: Doctor;
}) {
  const queryClient = useQueryClient();
  const canUpload = useSession().can("media:upload");
  const editing = !!doctor;
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DoctorFormValues>({ resolver: zodResolver(doctorSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    reset(
      doctor
        ? {
            name: doctor.name,
            specialization: doctor.specialization,
            hospital: doctor.hospital,
            phone: doctor.phone,
            email: doctor.email,
            qualifications: doctor.qualifications ?? "",
            photoUrl: doctor.photoUrl ?? "",
          }
        : EMPTY,
    );
  }, [open, doctor, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = editing ? await doctorsApi.update(doctor._id, values) : await doctorsApi.create(values);
      toast.success(editing ? "Doctor updated" : `${saved.name} added`);
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
          <DialogTitle>{editing ? "Edit doctor" : "Add doctor"}</DialogTitle>
          <DialogDescription>
            {editing ? "Update contact details and the public profile basics." : "Create a doctor record. Photo and qualifications are optional."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {canUpload && (
            <FormField id="doctor-photo" label="Photo" error={errors.photoUrl?.message}>
              <Controller
                control={control}
                name="photoUrl"
                render={({ field: photo }) => (
                  <ImageUpload id="doctor-photo" purpose="doctors" label="Photo" value={photo.value} onChange={photo.onChange} />
                )}
              />
            </FormField>
          )}
          {field("name", "Full name", { placeholder: "Dr. Jane Smith", autoComplete: "off" })}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("specialization", "Specialization", { placeholder: "Cardiology" })}
            {field("hospital", "Hospital", { placeholder: "City Hospital" })}
          </div>
          {field("qualifications", "Qualifications (shown publicly)", { placeholder: "MBBS, MD (Cardiology)" })}
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
              {isSubmitting ? "Saving…" : editing ? "Save changes" : "Add doctor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
