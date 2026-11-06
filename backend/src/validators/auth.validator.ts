import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase().max(254),
  password: z.string().min(1, "Password is required").max(200),
});
