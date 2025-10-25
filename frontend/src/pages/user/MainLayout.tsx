import { ModeToggle } from "@/components/mode-toggle";
import { PenTool } from "lucide-react";
import { Link, Outlet } from "react-router";

export default function MainLayout() {
  return (
    <>
      <nav className="w-full bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-primary text-white p-2 rounded-lg">
              <PenTool size={20} />
            </div>
            <p className="text-3xl font-bold">DrawBoard</p>
          </Link>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto p-4">
        <Outlet />
      </div>
    </>
  );
}
