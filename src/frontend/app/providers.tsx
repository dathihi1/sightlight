"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LanguageProvider } from "@/context/LanguageContext";
import { PushNotificationBridge } from "@/components/PushNotificationBridge";

/** TanStack Query lo cache và đồng bộ dữ liệu server (techstack §Quản lý trạng thái). */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dữ liệu được cache 30s trước khi được coi là cũ
            staleTime: 30_000,
            // Cache được giữ trong bộ nhớ 5 phút, sau đó bị loại bỏ
            gcTime: 5 * 60 * 1000,
            // Không tự động fetch lại khi cửa sổ focus
            refetchOnWindowFocus: false,
            // Chỉ retry 1 lần khi lỗi
            retry: 1,
            // Timeout 10s cho request
            networkMode: "always",
          },
          mutations: {
            retry: 1,
            networkMode: "always",
          },
        },
      }),
  );

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <PushNotificationBridge />
      </QueryClientProvider>
    </LanguageProvider>
  );
}
