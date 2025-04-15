// contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface User {
  username: string;
  user_type: string;
  class_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: User, token?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  getRedirectPath: (user: User) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAttemptedLogin, setHasAttemptedLogin] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const router = useRouter();

  const getRedirectPath = async (user: User): Promise<string> => {
    console.log("getRedirectPath called with user:", user); // Debug
    if (user.user_type === "rector") {
      return "/rectorHome";
    }
    if (user.user_type === "warden") {
      return "/wardenHome";
    }
    if (user.user_type === "student" && user.class_name) {
      try {
        console.log("Fetching /allot/user-events/ for class_name:", user.class_name);
        const response = await api.get("/allot/user-events/");
        const events = response.data.events;
        console.log("Events received:", events);
        const currentDate = new Date();
        const registrationEvent = events.find(
          (event: any) => event.event === "Registration"
        );

        if (
          registrationEvent &&
          new Date(registrationEvent.start_date) <= currentDate &&
          (!registrationEvent.end_date || new Date(registrationEvent.end_date) >= currentDate)
        ) {
          console.log("Registration active, redirecting to /applicationform");
          return "/applicationform";
        }
        console.log("No active registration, redirecting to /landing");
      } catch (error) {
        console.error("Error fetching events for routing:", error);
      }
    } else {
      console.log("Not a student or no class_name, redirecting to /landing");
    }
    return "/landing";
  };

  const login = async (userData: User, token?: string) => {
    setUser(userData);
    setHasAttemptedLogin(true);
    setIsLoggedOut(false);
    setLoading(false);

    const redirectPath = await getRedirectPath(userData);
    console.log("Redirecting to:", redirectPath);
    router.push(redirectPath);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setHasAttemptedLogin(false);
      setIsLoggedOut(true);
      setLoading(false);
      alert("Logout successful!");
      router.push("/");
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    if (isLoggedOut) return false;
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
    const protectedRoutes = ["/applicationform", "/rectorHome", "/landing"];
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
    getRedirectPath,
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
