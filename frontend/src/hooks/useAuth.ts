import { AuthContext, type AuthContextType } from "@/contexts/AuthContext";
import { useContext } from "react";

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider.");
  return ctx;
};
