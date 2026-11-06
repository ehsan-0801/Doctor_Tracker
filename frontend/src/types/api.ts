export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface FieldError {
  field?: string;
  message: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export type Role = "admin" | "management" | "staff" | "doctor";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  doctorId: string | null;
  photoUrl?: string;
}

export interface UserAccount {
  _id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  photoUrl?: string;
  doctor: { _id: string; name: string; specialization: string } | null;
  assignedDoctors?: { _id: string; name: string }[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserListParams extends ListParams {
  role?: Role;
  status?: "active" | "inactive";
}

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  qualifications?: string;
  photoUrl?: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSummary {
  _id: string;
  name: string;
  specialization: string;
  hospital?: string;
}

export interface Patient {
  _id: string;
  name: string;
  condition: string;
  doctor: DoctorSummary | null;
  /** When the current status-check token was issued; null when none is active. */
  accessTokenIssuedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssuedAccessToken {
  token: string;
  issuedAt: string;
}

export interface DoctorFilterOptions {
  specializations: string[];
  hospitals: string[];
}

export interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  assignedPatients: number;
  unassignedPatients: number;
  averagePatientsPerDoctor: number;
  recentPeriodDays: number;
  recentPatients: number;
  previousPeriodPatients: number;
  recentDoctors: number;
}

export interface PatientsPerDoctor {
  doctorId: string;
  name: string;
  specialization: string;
  patientCount: number;
}

export interface MonthlyRegistrations {
  month: string; // YYYY-MM
  count: number;
}

export interface ConditionCount {
  condition: string;
  count: number;
}

export type SortOrder = "asc" | "desc";

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "createdAt" | "name";
  sortOrder?: SortOrder;
}

export interface DoctorListParams extends ListParams {
  specialization?: string;
  hospital?: string;
}

export interface PatientListParams extends ListParams {
  condition?: string;
  doctorId?: string;
}
