/**
 * Client gọi API SignLight.
 *
 * Mọi response đều bọc trong `TransactionResponse` (api-spec §1), nên chỗ duy nhất biết về envelope
 * là file này — phần còn lại của giao diện chỉ thấy `result` hoặc một `ApiError` có `errorCode`.
 */

export interface TransactionResponse<T> {
  requestId: string;
  errorCode: string;
  errorMessage: string;
  result: T | null;
}

export class ApiError extends Error {
  constructor(
    readonly errorCode: string,
    readonly errorMessage: string,
    readonly httpStatus: number,
  ) {
    super(errorMessage || errorCode);
    this.name = "ApiError";
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:18080";

const TOKEN_STORAGE_KEY = "signlight.accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "signlight.refreshToken";

/**
 * Quản lý lưu trữ access token và refresh token dự phòng tại client.
 * Refresh token chính được lưu trong Cookie HttpOnly (ADR-06).
 */
export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  },
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  },
  set(token: string, refreshToken?: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    if (refreshToken) {
      window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  },
};

/** `requestId` vừa là mã truy vết vừa là trường bắt buộc của `BaseRequest`. */
export function newRequestId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

interface CallOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  auth?: boolean;
  signal?: AbortSignal;
  retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

function isAuthBypassEndpoint(path: string): boolean {
  return (
    path.startsWith("/api/v1/auth/login") ||
    path.startsWith("/api/v1/auth/demo-login") ||
    path.startsWith("/api/v1/auth/register") ||
    path.startsWith("/api/v1/auth/google") ||
    path.startsWith("/api/v1/auth/refresh") ||
    path.startsWith("/api/v1/auth/logout") ||
    path.startsWith("/api/v1/auth/password/")
  );
}

async function performSilentRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const storedRefreshToken = tokenStore.getRefreshToken();
      const requestId = newRequestId();
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
          "Accept-Language": "vi",
        },
        credentials: "include",
        body: JSON.stringify({
          requestId,
          version: "1.0",
          refreshToken: storedRefreshToken || undefined,
        }),
      });

      if (!response.ok) {
        tokenStore.clear();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("signlight:auth-change"));
        }
        return null;
      }

      const payload = (await response.json()) as TransactionResponse<{
        accessToken: string;
        refreshToken?: string;
      }>;

      if (payload && payload.errorCode === "00000" && payload.result?.accessToken) {
        tokenStore.set(payload.result.accessToken, payload.result.refreshToken);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("signlight:auth-change"));
        }
        return payload.result.accessToken;
      } else {
        tokenStore.clear();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("signlight:auth-change"));
        }
        return null;
      }
    } catch {
      tokenStore.clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("signlight:auth-change"));
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiCall<T>(path: string, options: CallOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal, retry = true } = options;
  const requestId = newRequestId();

  const headers: Record<string, string> = {
    "X-Request-Id": requestId,
    "Accept-Language": "vi",
  };
  if (body) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    signal,
    credentials: "include",
    // Request nào cũng mang requestId + version theo BaseRequest.
    body: body ? JSON.stringify({ requestId, version: "1.0", ...body }) : undefined,
  });

  let payload: TransactionResponse<T> | null = null;
  try {
    payload = (await response.json()) as TransactionResponse<T>;
  } catch {
    throw new ApiError("00499", "Không đọc được phản hồi từ máy chủ.", response.status);
  }

  // Silent Refresh Interceptor: Tự động refresh token khi gặp 401
  const isUnauthorized = response.status === 401 || payload.errorCode === "00401";
  if (isUnauthorized && retry && !isAuthBypassEndpoint(path)) {
    const newToken = await performSilentRefresh();
    if (newToken) {
      return apiCall<T>(path, { ...options, retry: false });
    }
  }

  if (!response.ok || payload.errorCode !== "00000") {
    throw new ApiError(payload.errorCode ?? "00499", payload.errorMessage, response.status);
  }
  return payload.result as T;
}
