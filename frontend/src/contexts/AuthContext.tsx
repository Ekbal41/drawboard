import type { QueryObserverResult } from "@tanstack/react-query";
import { createContext } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt?: string;
}

export interface AuthContextType {
  user: User | null;
  logout: () => Promise<void>;
  authLoading: "login" | "register" | "logout" | "user" | "facebook" | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  refetchUser: () => Promise<QueryObserverResult<User | null, unknown>>;
  facebookAuth: (fbResponse: { accessToken: string }) => Promise<void>;
  error: any;
}

export const AuthContext = createContext<AuthContextType | null>(null);
