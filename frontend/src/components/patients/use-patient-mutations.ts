"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { doctorsApi, patientsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";

/** Patient mutations; each refreshes every view whose numbers can change. */
export function usePatientMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ]);
  const onError = (error: unknown) =>
    toast.error(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");

  const remove = useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: async () => {
      toast.success("Patient deleted");
      await invalidate();
    },
    onError,
  });

  const unassign = useMutation({
    mutationFn: ({ doctorId, patientId }: { doctorId: string; patientId: string }) =>
      doctorsApi.removePatient(doctorId, patientId),
    onSuccess: async (patient) => {
      toast.success(`${patient.name} removed from this doctor`, {
        description: "The patient record is kept as unassigned.",
      });
      await invalidate();
    },
    onError,
  });

  return { remove, unassign, invalidate };
}
