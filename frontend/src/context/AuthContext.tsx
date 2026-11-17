import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, Role } from "@/types";
import { api } from "@/services/api";

interface AuthContextType {
  user: User | null;
  profileId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: Role | null;
  isDirector: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isParent: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  register: (payload: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => api.getCurrentUser());
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfileDetails = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setUser(null);
      setProfileId(null);
      setIsLoading(false);
      return;
    }

    try {
      const meRes = await api.getMe();
      if (meRes.success && meRes.data) {
        setUser(meRes.data);
        api.setCurrentUser(meRes.data);

        // Fetch profile UUID if student/teacher/parent
        if (meRes.data.role !== "DIRECTOR") {
          const profileRes = await api.getMyProfile();
          if (profileRes.success && profileRes.data?.profile_id) {
            setProfileId(profileRes.data.profile_id);
          }
        }
      } else {
        api.clearTokens();
        setUser(null);
        setProfileId(null);
      }
    } catch {
      // keep local cache if offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileDetails();

    const handleAuthExpired = () => {
      setUser(null);
      setProfileId(null);
    };

    window.addEventListener("sms:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("sms:auth-expired", handleAuthExpired);
  }, [fetchProfileDetails]);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    const res = await api.login(credentials);
    if (res.success && res.data) {
      setUser(res.data.user);
      await fetchProfileDetails();
      return { success: true };
    }
    setIsLoading(false);
    return {
      success: false,
      message: res.error?.message || "Invalid credentials. Please try again.",
    };
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    const res = await api.register(payload);
    if (res.success && res.data) {
      if (res.data.tokens) {
        setUser(res.data.user);
        await fetchProfileDetails();
      }
      setIsLoading(false);
      return { success: true };
    }
    setIsLoading(false);
    return {
      success: false,
      message: res.error?.message || "Registration failed.",
    };
  };

  const logout = async () => {
    setIsLoading(true);
    await api.logout();
    setUser(null);
    setProfileId(null);
    setIsLoading(false);
  };

  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profileId,
        isLoading,
        isAuthenticated: !!user,
        role,
        isDirector: role === "DIRECTOR",
        isTeacher: role === "TEACHER",
        isStudent: role === "STUDENT",
        isParent: role === "PARENT",
        login,
        register,
        logout,
        refreshProfile: fetchProfileDetails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
