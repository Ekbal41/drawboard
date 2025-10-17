import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export default function GuestRoutes() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
