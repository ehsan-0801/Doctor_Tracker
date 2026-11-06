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
}

export const usersApi = {
  list: (params: UserListParams) => api.list<UserAccount>("/users", { ...params }),
  create: (input: UserFormInput) => api.post<UserAccount>("/users", input),
  update: (id: string, input: Partial<{ name: string; role: Role; active: boolean; doctorId: string | null }>) =>
    api.patch<UserAccount>(`/users/${id}`, input),
  resetPassword: (id: string, password: string) => api.post<null>(`/users/${id}/reset-password`, { password }),
};
