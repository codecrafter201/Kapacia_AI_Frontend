import { createContext } from "react";

export interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  token: string;
  language: string;
  piiMasking: boolean;
  customSoapPrompt: string;
  supervisor?: string | null;
  masterSoapPrompt?: string | null;
}

export interface AuthContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<UserData | null>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
