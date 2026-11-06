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

export interface Admin {
  id: string;
  email: string;
}

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
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
  createdAt: string;
  updatedAt: string;
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
