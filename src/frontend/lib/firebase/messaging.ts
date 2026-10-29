import {
  getMessaging,
  isSupported,
  onMessage,
  onRegistered,
  onUnregistered,
  register as registerMessaging,
  unregister as unregisterMessaging,
  type MessagePayload,
  type Messaging,
} from "firebase/messaging";
import { apiCall } from "@/lib/api";
import {
  firebaseMessagingConfigured,
  firebaseVapidKey,
  getFirebaseClientApp,
} from "@/lib/firebase/client";
import { FCM_MESSAGE_EVENT, type SignLightPushMessage } from "@/lib/firebase/events";

const INSTALLATION_STORAGE_KEY = "signlight.fcmInstallationId";
const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";

interface MessagingContext {
  messaging: Messaging;
  serviceWorkerRegistration: ServiceWorkerRegistration;
}

interface RegistrationWaiter {
  resolve: (installationId: string) => void;
  reject: (error: unknown) => void;
}

let observerMessaging: Messaging | null = null;
let stopRegistrationObservers: (() => void) | null = null;
const registrationWaiters = new Set<RegistrationWaiter>();

function assertBrowserSupport() {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("Trình duyệt này chưa hỗ trợ thông báo đẩy.");
  }
}

async function getMessagingContext(): Promise<MessagingContext> {
  assertBrowserSupport();
  if (!firebaseMessagingConfigured || !(await isSupported())) {
    throw new Error("Trình duyệt hoặc cấu hình hiện tại chưa hỗ trợ Firebase Messaging.");
  }

  const serviceWorkerRegistration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
    scope: "/",
    updateViaCache: "none",
  });
  const messaging = getMessaging(getFirebaseClientApp());
  return { messaging, serviceWorkerRegistration };
}

function saveInstallationId(installationId: string | null) {
  if (typeof window === "undefined") return;
  if (installationId) {
    window.localStorage.setItem(INSTALLATION_STORAGE_KEY, installationId);
  } else {
    window.localStorage.removeItem(INSTALLATION_STORAGE_KEY);
  }
}

export function readInstallationId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(INSTALLATION_STORAGE_KEY);
}

async function persistInstallation(installationId: string) {
  await apiCall<{ enabled: boolean; registered: boolean }>("/api/v1/push/installations", {
    method: "POST",
    body: { installationId },
  });
  saveInstallationId(installationId);
}

async function revokeInstallation(installationId: string) {
  await apiCall<{ revoked: boolean }>("/api/v1/push/installations/revoke", {
    method: "POST",
    body: { installationId },
  });
}

function ensureRegistrationObservers(messaging: Messaging) {
  if (observerMessaging === messaging) return;
  stopRegistrationObservers?.();
  observerMessaging = messaging;

  const stopRegistered = onRegistered(messaging, (installationId) => {
    void persistInstallation(installationId)
      .then(() => {
        registrationWaiters.forEach((waiter) => waiter.resolve(installationId));
        registrationWaiters.clear();
      })
      .catch((error) => {
        registrationWaiters.forEach((waiter) => waiter.reject(error));
        registrationWaiters.clear();
      });
  });
  const stopUnregistered = onUnregistered(messaging, (installationId) => {
    void revokeInstallation(installationId)
      .catch(() => undefined)
      .finally(() => saveInstallationId(null));
  });
  stopRegistrationObservers = () => {
    stopRegistered();
    stopUnregistered();
  };
}

export async function enablePushNotifications(options: { requestPermission?: boolean } = {}) {
  const { requestPermission = true } = options;
  assertBrowserSupport();

  let permission = Notification.permission;
  if (permission === "default" && requestPermission) {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Thông báo đang bị chặn trong cài đặt trình duyệt."
        : "Bạn chưa cho phép SignLight gửi thông báo.",
    );
  }

  const { messaging, serviceWorkerRegistration } = await getMessagingContext();
  ensureRegistrationObservers(messaging);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let waiter: RegistrationWaiter;

  const installationIdPromise = new Promise<string>((resolve, reject) => {
    waiter = { resolve, reject };
    registrationWaiters.add(waiter);
    timeoutId = setTimeout(
      () => reject(new Error("Không thể hoàn tất đăng ký thông báo. Vui lòng thử lại.")),
      15_000,
    );
  });

  try {
    try {
      await registerMessaging(messaging, {
        vapidKey: firebaseVapidKey,
        serviceWorkerRegistration,
      });
    } catch (error) {
      waiter!.reject(error);
    }
    const installationId = await installationIdPromise;
    return installationId;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    registrationWaiters.delete(waiter!);
  }
}

export async function syncExistingPushRegistration() {
  if (
    !firebaseMessagingConfigured ||
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return null;
  }
  return enablePushNotifications({ requestPermission: false });
}

export async function revokePushNotifications() {
  if (!firebaseMessagingConfigured || typeof window === "undefined") return;

  const installationId = readInstallationId();
  let revokeError: unknown;
  if (installationId) {
    try {
      await revokeInstallation(installationId);
    } catch (error) {
      revokeError = error;
    }
  }

  try {
    const { messaging } = await getMessagingContext();
    await unregisterMessaging(messaging);
  } finally {
    saveInstallationId(null);
  }

  if (revokeError) throw revokeError;
}

function toSignLightMessage(payload: MessagePayload): SignLightPushMessage {
  return {
    notificationId: payload.data?.notificationId,
    title: payload.notification?.title ?? payload.data?.title ?? "SignLight",
    body: payload.notification?.body ?? payload.data?.body ?? "Bạn có một thông báo mới.",
    type: payload.data?.type,
    targetUrl: safeTargetUrl(payload.data?.targetUrl ?? payload.fcmOptions?.link),
  };
}

function safeTargetUrl(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/thong-bao";
}

export async function startFirebaseMessageListener() {
  if (!firebaseMessagingConfigured) return () => undefined;
  const { messaging } = await getMessagingContext();
  ensureRegistrationObservers(messaging);

  const stopMessages = onMessage(messaging, (payload) => {
    window.dispatchEvent(
      new CustomEvent<SignLightPushMessage>(FCM_MESSAGE_EVENT, {
        detail: toSignLightMessage(payload),
      }),
    );
  });
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data?.type !== "SIGNLIGHT_FCM_MESSAGE" || !event.data.message) return;
    const raw = event.data.message as Partial<SignLightPushMessage>;
    window.dispatchEvent(
      new CustomEvent<SignLightPushMessage>(FCM_MESSAGE_EVENT, {
        detail: {
          notificationId: raw.notificationId,
          title: raw.title || "SignLight",
          body: raw.body || "Bạn có một thông báo mới.",
          type: raw.type,
          targetUrl: safeTargetUrl(raw.targetUrl),
        },
      }),
    );
  };
  navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
  return () => {
    stopMessages();
    navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
  };
}
