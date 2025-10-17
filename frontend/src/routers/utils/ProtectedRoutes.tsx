import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function ProtectedRoutes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user && location.pathname !== "/auth") {
      navigate("/auth", { state: { from: location } });
    }
  }, [user, navigate, location]);

  return user ? <Outlet /> : null;
}
