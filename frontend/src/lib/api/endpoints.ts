import type {
  ConditionCount,
  DashboardStats,
  Doctor,
  DoctorFilterOptions,
  DoctorListParams,
  DoctorSummary,
  MonthlyRegistrations,
  Patient,
  PatientListParams,
  PatientsPerDoctor,
  Role,
  SessionUser,
  UserAccount,
  UserListParams,
} from "@/types/api";
import type { DoctorFormValues, PatientFormValues } from "@/lib/validations";
import { api } from "./client";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: SessionUser }>("/auth/login", { email, password }, { skipAuthRedirect: true }),
  logout: () => api.post<null>("/auth/logout", undefined, { skipAuthRedirect: true }),
  session: () => api.getQuiet<{ user: SessionUser }>("/auth/session"),
  sessionOrRedirect: () => api.get<{ user: SessionUser }>("/auth/session"),
};

export const doctorsApi = {
  list: (params: DoctorListParams) => api.list<Doctor>("/doctors", { ...params }),
  get: (id: string) => api.get<Doctor>(`/doctors/${id}`),
  create: (values: DoctorFormValues) => api.post<Doctor>("/doctors", values),
  update: (id: string, values: Partial<DoctorFormValues>) => api.patch<Doctor>(`/doctors/${id}`, values),
  filters: () => api.get<DoctorFilterOptions>("/doctors/filters"),
  options: (search: string) => api.get<DoctorSummary[]>("/doctors/options", { search, limit: 20 }),
  patients: (id: string, params: PatientListParams) => api.list<Patient>(`/doctors/${id}/patients`, { ...params }),
  addPatient: (id: string, values: Omit<PatientFormValues, "doctorId">) =>
    api.post<Patient>(`/doctors/${id}/patients`, values),
  removePatient: (id: string, patientId: string) => api.delete<Patient>(`/doctors/${id}/patients/${patientId}`),
};

export const patientsApi = {
  list: (params: PatientListParams) => api.list<Patient>("/patients", { ...params }),
  create: (values: PatientFormValues) => api.post<Patient>("/patients", values),
  update: (id: string, values: Partial<Omit<PatientFormValues, "doctorId">> & { doctorId?: string | null }) =>
    api.patch<Patient>(`/patients/${id}`, values),
  delete: (id: string) => api.delete<null>(`/patients/${id}`),
  conditions: () => api.get<string[]>("/patients/conditions"),
};

export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/dashboard/stats"),
  patientsPerDoctor: (limit = 10) => api.get<PatientsPerDoctor[]>("/dashboard/patients-per-doctor", { limit }),
  registrations: (months = 12) => api.get<MonthlyRegistrations[]>("/dashboard/registrations", { months }),
  conditions: (limit = 6) => api.get<ConditionCount[]>("/dashboard/conditions", { limit }),
};

export interface UserFormInput {
  name: string;
  email: string;
  role: Role;
  password: string;
  doctorId?: string;
  photoUrl?: string;
  assignedDoctorIds?: string[];
}

export const usersApi = {
  list: (params: UserListParams) => api.list<UserAccount>("/users", { ...params }),
  create: (input: UserFormInput) => api.post<UserAccount>("/users", input),
  update: (id: string, input: Partial<{ name: string; role: Role; active: boolean; doctorId: string | null; photoUrl: string; assignedDoctorIds: string[] }>) =>
    api.patch<UserAccount>(`/users/${id}`, input),
  resetPassword: (id: string, password: string) => api.post<null>(`/users/${id}/reset-password`, { password }),
};

export const publicApi = {
  site: () => api.get<import("@/types/site").PublicSite>("/public/site"),
  doctors: (params: { page?: number; search?: string; specialization?: string }) =>
    api.list<import("@/types/site").PublicDoctor>("/public/doctors", { ...params, limit: 12 }),
};

export const settingsApi = {
  get: () => api.get<import("@/types/site").SiteSettings>("/settings"),
  update: (settings: import("@/types/site").SiteSettings) =>
    api.put<import("@/types/site").SiteSettings>("/settings", settings),
};

export interface UploadSignature {
  signature: string;
  timestamp: number;
  folder: string;
  allowed_formats: string;
  apiKey: string;
  cloudName: string;
  uploadUrl: string;
}

export const uploadsApi = {
  signature: (purpose: "doctors" | "staff" | "site") => api.post<UploadSignature>("/uploads/signature", { purpose }),
};

type T = typeof import("@/types/tracking");
type Loc = import("@/types/tracking").HospitalLocation;

export const trackingApi = {
  locations: () => api.get<Loc[]>("/locations"),
  createLocation: (input: Omit<Loc, "_id">) => api.post<Loc>("/locations", input),
  updateLocation: (id: string, input: Partial<Omit<Loc, "_id">>) => api.patch<Loc>(`/locations/${id}`, input),
  deleteLocation: (id: string) => api.delete<null>(`/locations/${id}`),
  presence: () => api.get<import("@/types/tracking").PresenceView[]>("/presence"),
  setPresence: (userId: string, input: { locationId: string | null; status: T["PRESENCE_STATUSES"][number]; note: string }) =>
    api.put<import("@/types/tracking").PresenceView>(`/presence/${userId}`, input),
  history: (userId: string, days = 7) => api.get<import("@/types/tracking").PresenceEventView[]>(`/presence/${userId}/history`, { days }),
  realtimeToken: () => api.getQuiet<{ token: string; expiresAt: number }>("/realtime/token"),
};

export const chatApi = {
  contacts: () => api.get<import("@/types/tracking").ChatContact[]>("/chat/contacts"),
  conversations: () => api.get<import("@/types/tracking").ConversationSummary[]>("/chat/conversations"),
  open: (userId: string) => api.post<{ _id: string; contact: import("@/types/tracking").ChatContact; canSend: boolean }>("/chat/conversations", { userId }),
  messages: (id: string, before?: string) =>
    api.get<{ contact: import("@/types/tracking").ChatContact; canSend: boolean; messages: import("@/types/tracking").ChatMessage[]; hasMore: boolean }>(
      `/chat/conversations/${id}/messages`,
      { before, limit: 40 },
    ),
  send: (id: string, message: { body: string; attachment?: import("@/types/tracking").ChatAttachment }) =>
    api.post<import("@/types/tracking").ChatMessage>(`/chat/conversations/${id}/messages`, message),
  attachmentSignature: (id: string, kind: import("@/types/tracking").AttachmentKind) =>
    api.post<{ signature: string; timestamp: number; folder: string; allowed_formats?: string; apiKey: string; uploadUrl: string }>(
      `/chat/conversations/${id}/attachments/signature`,
      { kind },
    ),
  read: (id: string) => api.post<null>(`/chat/conversations/${id}/read`),
};

export const auditApi = {
  list: (params: { page?: number; search?: string; action?: string; entityType?: string; startDate?: string; endDate?: string }) =>
    api.list<import("@/types/audit").AuditEntry>("/audit", { ...params, limit: 20 }),
  facets: () => api.get<{ actions: string[]; entityTypes: string[] }>("/audit/facets"),
};

export const notificationsApi = {
  list: () => api.get<{ items: import("@/types/audit").AppNotification[]; unread: number; hasMore: boolean }>("/notifications", { limit: 20 }),
  read: (id: string) => api.post<null>(`/notifications/${id}/read`),
  readAll: () => api.post<null>("/notifications/read-all"),
};
