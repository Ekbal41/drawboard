import { Routes, Route } from "react-router";
import LandingPage from "@/pages/root/LandingPage";
import Dashboard from "@/pages/user/Dashboard";
import Account from "@/pages/user/Account";
import DrawBoard from "@/pages/user/DrawBoard";
import MainLayout from "@/pages/user/MainLayout";

export default function RootRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/account" element={<Account />} />
      </Route>
      <Route path="/board/:boardId" element={<DrawBoard />} />
    </Routes>
  );
}
