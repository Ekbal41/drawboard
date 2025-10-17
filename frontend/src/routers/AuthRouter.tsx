import { Routes, Route } from "react-router";
import LoginRegister from "@/pages/auth/LoginRegister";
import GuestRoutes from "./utils/GuestRoutes";
import PasswordChange from "@/pages/auth/PasswordChange";
import PasswordResetRequest from "@/pages/auth/PasswordResetRequ";

export default function AuthRouter() {
  return (
    <Routes>
      <Route element={<GuestRoutes />}>
        <Route path="/" element={<LoginRegister />} />
      </Route>
      <Route path="/change-password" element={<PasswordChange />} />
      <Route
        path="/request-password-reset"
        element={<PasswordResetRequest />}
      />
    </Routes>
  );
}
