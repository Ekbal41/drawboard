import { Loader } from "lucide-react";

interface AppLoaderProps {
  fullScreen?: boolean;
}

export default function AppLoader({ fullScreen = false }: AppLoaderProps) {
  return (
    <div
      className={`flex justify-center items-center ${
        fullScreen ? "fixed inset-0 bg-white bg-opacity-80 z-50" : "h-full"
      }`}
    >
      <Loader className="w-8 h-8 text-gray-500 animate-spin" />
    </div>
  );
}
