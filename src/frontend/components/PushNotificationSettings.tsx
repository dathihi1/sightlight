"use client";

import { useEffect, useState } from "react";
import { IconBell } from "@/components/ui/Icons";
import { useLanguage } from "@/context/LanguageContext";
import { firebaseMessagingConfigured } from "@/lib/firebase/client";
import {
  enablePushNotifications,
  readInstallationId,
  revokePushNotifications,
} from "@/lib/firebase/messaging";

type PushState = "unsupported" | "off" | "on" | "blocked";

function currentState(): PushState {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission === "granted" && readInstallationId()) return "on";
  return "off";
}

export function PushNotificationSettings() {
  const { t } = useLanguage();
  const [state, setState] = useState<PushState>("off");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setState(currentState()), []);

  if (!firebaseMessagingConfigured) return null;

  const enable = async () => {
    setBusy(true);
    setError("");
    try {
      await enablePushNotifications();
      setState("on");
    } catch (cause) {
      setState(currentState());
      setError(cause instanceof Error ? cause.message : t("Không thể bật thông báo.", "Could not enable notifications."));
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError("");
    try {
      await revokePushNotifications();
      setState("off");
    } catch (cause) {
      setState(currentState());
      setError(cause instanceof Error ? cause.message : t("Không thể tắt thông báo.", "Could not disable notifications."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 flex flex-col gap-4 rounded-3xl border border-brand-200 bg-gradient-to-r from-brand-50 to-sky-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-brand-700 shadow-sm">
          <IconBell className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-ink-900">{t("Thông báo trên thiết bị", "Device notifications")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            {state === "on"
              ? t("Đã bật. Bạn sẽ nhận cập nhật ngay cả khi không mở SignLight.", "Enabled. You will receive updates even when SignLight is closed.")
              : state === "blocked"
                ? t("Trình duyệt đang chặn thông báo. Hãy cho phép SignLight trong phần cài đặt trang web.", "Notifications are blocked. Allow SignLight in your browser site settings.")
                : state === "unsupported"
                  ? t("Trình duyệt này chưa hỗ trợ thông báo đẩy.", "This browser does not support push notifications.")
                  : t("Bật để không bỏ lỡ tiến độ học, nhiệm vụ và phần thưởng.", "Enable this so you do not miss learning progress, quests, and rewards.")}
          </p>
          {error && <p className="mt-1 text-xs font-semibold text-danger-600">{error}</p>}
        </div>
      </div>

      {state === "on" ? (
        <button type="button" disabled={busy} onClick={disable} className="btn btn-secondary btn-sm shrink-0 disabled:opacity-60">
          {busy ? t("Đang tắt...", "Disabling...") : t("Tắt thông báo", "Disable")}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy || state === "blocked" || state === "unsupported"}
          onClick={enable}
          className="btn btn-primary btn-sm shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? t("Đang bật...", "Enabling...") : t("Bật thông báo", "Enable notifications")}
        </button>
      )}
    </section>
  );
}
