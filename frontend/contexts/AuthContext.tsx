"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface User {
  username: string;
  user_type:string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false); // New flag
  const router = useRouter();

  const login = (userData: User) => {
    setUser(userData);
    setHasAttemptedLogin(true);
    setIsLoggedOut(false); // Reset on login
    setLoading(false);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setHasAttemptedLogin(false);
      setIsLoggedOut(true); // Mark as logged out
      setLoading(false);
      alert("Logout successful!");
      router.push("/"); // Include auth=login as per your flow
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    if (isLoggedOut) return false; // Skip if logged out
    try {
      const response = await api.get("/auth/user/");
      setUser(response.data);
      setHasAttemptedLogin(true);
      return true;
    } catch (error) {
      console.error("Check auth error:", error);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const protectedRoutes = ["/dashboard", "/invites", "/students", "/rooms"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      window.location.pathname.startsWith(route)
    );

    if (isProtectedRoute && !hasAttemptedLogin && !isLoggedOut) {
      const initAuth = async () => {
        await checkAuth();
      };
      initAuth();
    } else {
      setLoading(false);
    }
  }, [hasAttemptedLogin, isLoggedOut]);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
