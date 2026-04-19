import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  token: {
    access_token: string;
    token_type: string;
  };
  user: User;
}
