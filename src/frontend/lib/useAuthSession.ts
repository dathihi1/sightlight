"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiCall, tokenStore } from "./api";

export interface UserProfile {
  displayName: string;
  avatarUrl?: string;
}

export interface UserPreferences {
  activeCourseId: string | null;
}

export interface MeResult {
  preferences: UserPreferences;
  profile: UserProfile;
}

const AUTH_CHANGE_EVENT = "signlight:auth-change";
const TOKEN_STORAGE_KEY = "signlight.accessToken";

export function dispatchAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function useAuthSession() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setToken(tokenStore.get());

    const handleAuthChange = () => {
      setToken(tokenStore.get());
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_STORAGE_KEY || e.key === null) {
        setToken(tokenStore.get());
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiCall<MeResult>("/api/v1/me"),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const logout = useCallback(async () => {
    try {
      await apiCall("/api/v1/auth/logout", {
        method: "POST",
        body: { refreshToken: tokenStore.getRefreshToken() || undefined },
      });
    } catch {
      // Bỏ qua lỗi mạng khi logout để người dùng luôn được đăng xuất tại client
    } finally {
      tokenStore.clear();
      setToken(null);
      queryClient.removeQueries({ queryKey: ["me"] });
      dispatchAuthChange();
      router.push("/");
    }
  }, [queryClient, router]);

  const isLoggedIn = Boolean(token) && !meQuery.isError;

  return {
    isClient,
    isLoggedIn,
    token,
    user: meQuery.data,
    isLoading: meQuery.isLoading,
    logout,
  };
}
