import type { DoctorListParams, PatientListParams } from "@/types/api";

/** Hierarchical keys so a mutation can invalidate a whole resource family. */
export const queryKeys = {
  session: ["session"] as const,
  doctors: {
    all: ["doctors"] as const,
    list: (params: DoctorListParams) => ["doctors", "list", params] as const,
    detail: (id: string) => ["doctors", "detail", id] as const,
    filters: ["doctors", "filters"] as const,
    options: (search: string) => ["doctors", "options", search] as const,
    patients: (id: string, params: PatientListParams) => ["doctors", "detail", id, "patients", params] as const,
  },
  patients: {
    all: ["patients"] as const,
    list: (params: PatientListParams) => ["patients", "list", params] as const,
    conditions: ["patients", "conditions"] as const,
  },
  dashboard: { all: ["dashboard"] as const },
  users: {
    all: ["users"] as const,
    list: (params: object) => ["users", "list", params] as const,
  },
};
