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
  site: ["site"] as const,
  publicDoctors: (params: object) => ["public-doctors", params] as const,
  settings: ["settings"] as const,
  locations: ["locations"] as const,
  notifications: ["notifications"] as const,
  audit: {
    all: ["audit"] as const,
    list: (params: object) => ["audit", "list", params] as const,
    facets: ["audit", "facets"] as const,
  },
  presence: ["presence"] as const,
  presenceHistory: (userId: string) => ["presence", "history", userId] as const,
  chat: {
    all: ["chat"] as const,
    contacts: ["chat", "contacts"] as const,
    conversations: ["chat", "conversations"] as const,
    messages: (id: string) => ["chat", "messages", id] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params: object) => ["users", "list", params] as const,
  },
};
