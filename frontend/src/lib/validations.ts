import { z } from "zod";

// Mirrors the backend validators (backend/src/validators) so users get the same
// messages before a request is sent. The API remains the source of truth.

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Password is required"),
});

const PHONE_PATTERN = /^\+?[0-9][0-9\s\-()]{6,19}$/;

export const doctorSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  specialization: z.string().trim().min(2, "Specialization is required").max(120),
  hospital: z.string().trim().min(2, "Hospital is required").max(160),
  phone: z.string().trim().regex(PHONE_PATTERN, "Enter a valid phone number"),
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email")),
});

export const patientSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  condition: z.string().trim().min(2, "Condition is required").max(120),
  doctorId: z.string().min(1, "Select a doctor"),
});

/** Same rule as the API (backend/src/validators/user.validator.ts). */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200)
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

export type LoginFormValues = z.infer<typeof loginSchema>;
export type DoctorFormValues = z.infer<typeof doctorSchema>;
export type PatientFormValues = z.infer<typeof patientSchema>;
