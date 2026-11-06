"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DoctorCombobox, type DoctorChoice } from "@/components/patients/doctor-combobox";
import { fieldAria, FormField } from "@/components/shared/form-field";
import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usersApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { applyApiErrors } from "@/lib/form-errors";
import { ROLE_LABELS } from "@/lib/permissions";
import { passwordSchema } from "@/lib/validations";
import type { Role, UserAccount } from "@/types/api";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

const baseSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email")),
  role: z.enum(["admin", "management", "staff", "doctor"]),
  password: z.string(),
  photoUrl: z.string(),
  doctor: z.custom<DoctorChoice | null>(),
  assigned: z.array(z.object({ _id: z.string(), name: z.string() })).max(50),
});

const makeSchema = (creating: boolean) =>
  baseSchema
    .extend({ password: creating ? passwordSchema : z.string() })
    .refine((v) => v.role !== "doctor" || v.doctor, { message: "Select the doctor this account belongs to", path: ["doctor"] });

type FormValues = z.infer<typeof baseSchema>;

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing. */
  user?: UserAccount;
}) {
  const queryClient = useQueryClient();
  const creating = !user;
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(makeSchema(creating)) });

  useEffect(() => {
    if (!open) return;
    reset({
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "staff",
      password: "",
      photoUrl: user?.photoUrl ?? "",
      assigned: user?.assignedDoctors ?? [],
      doctor: user?.doctor ? { _id: user.doctor._id, name: user.doctor.name } : null,
    });
  }, [open, user, reset]);

  const role = useWatch({ control, name: "role" });

  const onSubmit = handleSubmit(async (values) => {
    const doctorId = values.role === "doctor" ? values.doctor?._id : undefined;
    try {
      if (creating) {
        await usersApi.create({
          name: values.name,
          email: values.email,
          role: values.role,
          password: values.password,
          doctorId,
          photoUrl: values.photoUrl,
          assignedDoctorIds: values.assigned.map((d) => d._id),
        });
        toast.success(`Account created for ${values.name}`);
      } else {
        await usersApi.update(user._id, {
          name: values.name,
          role: values.role,
          doctorId: doctorId ?? null,
          photoUrl: values.photoUrl,
          assignedDoctorIds: values.assigned.map((d) => d._id),
        });
        toast.success("Account updated");
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      onOpenChange(false);
    } catch (error) {
      applyApiErrors(error, setError, ["name", "email", "role", "password", "doctorId"]);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{creating ? "Add user" : "Edit user"}</DialogTitle>
          <DialogDescription>
            {creating
              ? "Create a login and choose what this person can access."
              : "Changing the role or linked doctor signs the user out so new permissions apply immediately."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField id="user-photo" label="Photo (optional)">
            <Controller
              control={control}
              name="photoUrl"
              render={({ field }) => <ImageUpload id="user-photo" purpose="staff" label="Photo" value={field.value} onChange={field.onChange} />}
            />
          </FormField>
          <FormField id="user-name" label="Full name" error={errors.name?.message}>
            <Input {...fieldAria("user-name", errors.name?.message)} className="h-10" {...register("name")} />
          </FormField>
          <FormField id="user-email" label="Email" error={errors.email?.message}>
            <Input
              {...fieldAria("user-email", errors.email?.message)}
              type="email"
              className="h-10"
              disabled={!creating}
              autoComplete="off"
              {...register("email")}
            />
          </FormField>
          <FormField id="user-role" label="Role" error={errors.role?.message}>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="user-role" className="h-10! w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          {role === "doctor" && (
            <FormField id="user-doctor" label="Doctor record" error={errors.doctor?.message}>
              <Controller
                control={control}
                name="doctor"
                render={({ field }) => (
                  <DoctorCombobox id="user-doctor" value={field.value} onChange={field.onChange} invalid={!!errors.doctor} />
                )}
              />
            </FormField>
          )}
          {(role === "staff" || role === "management") && (
            <FormField id="user-assigned" label="Assigned doctors" hint="Assigned staff can chat with these doctors and update their location.">
              <Controller
                control={control}
                name="assigned"
                render={({ field }) => (
                  <div className="space-y-2">
                    {field.value.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {field.value.map((d) => (
                          <li key={d._id} className="flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs">
                            {d.name}
                            <button
                              type="button"
                              onClick={() => field.onChange(field.value.filter((x) => x._id !== d._id))}
                              className="rounded-full p-0.5 hover:bg-background"
                              aria-label={`Remove ${d.name}`}
                            >
                              <X className="size-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <DoctorCombobox
                      id="user-assigned"
                      value={null}
                      placeholder="Add a doctor…"
                      onChange={(choice) => choice && !field.value.some((x) => x._id === choice._id) && field.onChange([...field.value, choice])}
                    />
                  </div>
                )}
              />
            </FormField>
          )}
          {creating && (
            <FormField id="user-password" label="Initial password" error={errors.password?.message} hint="At least 8 characters with a letter and a number.">
              <Input
                {...fieldAria("user-password", errors.password?.message)}
                type="password"
                className="h-10"
                autoComplete="new-password"
                {...register("password")}
              />
            </FormField>
          )}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              {isSubmitting ? "Saving…" : creating ? "Create account" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
