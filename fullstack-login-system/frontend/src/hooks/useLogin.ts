import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { LoginFormValues, AuthResponse } from "@/lib/zod-schemas";

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const login = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<AuthResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        values
      );

      const { user, token } = response.data;
      setAuth(user, token.access_token);
      
      router.push("/dashboard");
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.detail || "Authentication failed");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};
