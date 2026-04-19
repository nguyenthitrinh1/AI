import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const { user, isAuthenticated, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const logout = () => {
    storeLogout();
    router.replace("/login");
  };

  return { user, isAuthenticated, logout };
};
