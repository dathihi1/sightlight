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

/**
 * GĐ1 giữ access token trong `localStorage` để demo chạy được ngay.
 *
 * ⚠️ Nợ kỹ thuật đã biết: ADR-06 yêu cầu refresh token nằm ở cookie `HttpOnly` và access token chỉ
 * sống trong bộ nhớ. Phải đổi trước GATE-5 (rủi ro XSS đánh cắp token — pentest DR-01).
 */
export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  },
  set(token: string) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  },
  clear() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
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
}

export async function apiCall<T>(path: string, options: CallOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, signal } = options;
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
    // Request nào cũng mang requestId + version theo BaseRequest.
    body: body ? JSON.stringify({ requestId, version: "1.0", ...body }) : undefined,
  });

  let payload: TransactionResponse<T> | null = null;
  try {
    payload = (await response.json()) as TransactionResponse<T>;
  } catch {
    throw new ApiError("00499", "Không đọc được phản hồi từ máy chủ.", response.status);
  }

  if (!response.ok || payload.errorCode !== "00000") {
    throw new ApiError(payload.errorCode ?? "00499", payload.errorMessage, response.status);
  }
  return payload.result as T;
}
