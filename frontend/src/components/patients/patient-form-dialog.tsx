"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { doctorsApi, patientsApi } from "@/lib/api/endpoints";
import { applyApiErrors } from "@/lib/form-errors";
import { patientSchema } from "@/lib/validations";
import type { DoctorSummary, Patient } from "@/types/api";
import { ConditionCombobox } from "./condition-combobox";
import { DoctorCombobox, type DoctorChoice } from "./doctor-combobox";
import { usePatientMutations } from "./use-patient-mutations";

// `doctor` holds the picker's display value; `doctorId` is what is validated and sent.
// Editing may leave an unassigned patient unassigned, so only creation requires a doctor.
const makeSchema = (requireDoctor: boolean) =>
  patientSchema.extend({
    doctorId: requireDoctor ? patientSchema.shape.doctorId : z.string(),
    doctor: z.custom<DoctorChoice | null>(),
  });
type FormValues = z.infer<ReturnType<typeof makeSchema>>;

type Mode =
  | { kind: "create" }
  | { kind: "create-for-doctor"; doctor: DoctorSummary }
  | { kind: "edit"; patient: Patient };

export function PatientFormDialog({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
}) {
  const { invalidate } = usePatientMutations();
  const editing = mode.kind === "edit" ? mode.patient : null;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(makeSchema(mode.kind === "create")),
  });

  useEffect(() => {
    if (!open) return;
    const doctor =
      mode.kind === "edit" ? mode.patient.doctor : mode.kind === "create-for-doctor" ? mode.doctor : null;
    reset({
      name: editing?.name ?? "",
      condition: editing?.condition ?? "",
      doctorId: doctor?._id ?? "",
      doctor: doctor ? { _id: doctor._id, name: doctor.name } : null,
    });
  }, [open, mode, editing, reset]);

  const onSubmit = handleSubmit(async ({ name, condition, doctorId }) => {
    try {
      if (mode.kind === "edit") {
        const doctorChanged = doctorId && doctorId !== (mode.patient.doctor?._id ?? "");
        await patientsApi.update(mode.patient._id, { name, condition, ...(doctorChanged ? { doctorId } : {}) });
        toast.success("Patient updated");
      } else if (mode.kind === "create-for-doctor") {
        await doctorsApi.addPatient(mode.doctor._id, { name, condition });
        toast.success(`${name} added to ${mode.doctor.name}`);
      } else {
        await patientsApi.create({ name, condition, doctorId });
        toast.success("Patient created");
      }
      await invalidate();
      onOpenChange(false);
    } catch (error) {
      applyApiErrors(error, setError, ["name", "condition", "doctorId"]);
    }
  });

  const title = mode.kind === "edit" ? "Edit patient" : "Add patient";
  const description =
    mode.kind === "create-for-doctor"
      ? `The patient will be associated with ${mode.doctor.name}.`
      : mode.kind === "edit"
        ? "Update the patient's details or reassign them to another doctor."
        : "Create a patient record and associate it with a doctor.";

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField id="patient-name" label="Full name" error={errors.name?.message}>
            <Input {...fieldAria("patient-name", errors.name?.message)} className="h-10" autoComplete="off" {...register("name")} />
          </FormField>

          <FormField
            id="patient-condition"
            label="Condition"
            error={errors.condition?.message}
            hint="Choose from the list or type a new condition."
          >
            <Controller
              control={control}
              name="condition"
              render={({ field }) => (
                <ConditionCombobox
                  id="patient-condition"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  invalid={!!errors.condition}
                  describedBy={errors.condition ? "patient-condition-error" : "patient-condition-hint"}
                />
              )}
            />
          </FormField>

          {mode.kind !== "create-for-doctor" && (
            <FormField
              id="patient-doctor"
              label="Doctor"
              error={errors.doctorId?.message}
              hint={editing && !editing.doctor ? "This patient is currently unassigned." : undefined}
            >
              <Controller
                control={control}
                name="doctor"
                render={({ field }) => (
                  <DoctorCombobox
                    id="patient-doctor"
                    value={field.value}
                    onChange={(choice) => {
                      field.onChange(choice);
                      setValue("doctorId", choice?._id ?? "", { shouldValidate: !!errors.doctorId });
                    }}
                    invalid={!!errors.doctorId}
                    describedBy={errors.doctorId ? "patient-doctor-error" : undefined}
                  />
                )}
              />
            </FormField>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              {isSubmitting ? "Saving…" : mode.kind === "edit" ? "Save changes" : "Add patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
