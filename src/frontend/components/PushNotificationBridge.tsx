"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconBell } from "@/components/ui/Icons";
import { firebaseMessagingConfigured } from "@/lib/firebase/client";
import { FCM_MESSAGE_EVENT, type SignLightPushMessage } from "@/lib/firebase/events";
import {
  startFirebaseMessageListener,
  syncExistingPushRegistration,
} from "@/lib/firebase/messaging";
import { useAuthSession } from "@/lib/useAuthSession";

export function PushNotificationBridge() {
  const { isLoggedIn } = useAuthSession();
  const [message, setMessage] = useState<SignLightPushMessage | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !firebaseMessagingConfigured) return;

    let disposed = false;
    let stop: () => void = () => undefined;
    void startFirebaseMessageListener()
      .then((unsubscribe) => {
        if (disposed) unsubscribe();
        else stop = unsubscribe;
      })
      .catch(() => undefined);
    void syncExistingPushRegistration().catch(() => undefined);

    return () => {
      disposed = true;
      stop();
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const handleMessage = (event: Event) => {
      const pushEvent = event as CustomEvent<SignLightPushMessage>;
      setMessage(pushEvent.detail);
    };
    window.addEventListener(FCM_MESSAGE_EVENT, handleMessage);
    return () => window.removeEventListener(FCM_MESSAGE_EVENT, handleMessage);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 7_000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-brand-200 bg-white p-4 shadow-2xl">
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
          <IconBell className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink-900">{message.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{message.body}</p>
          <Link
            href={message.targetUrl}
            onClick={() => setMessage(null)}
            className="mt-2 inline-flex text-xs font-bold text-brand-700 hover:underline"
          >
            Xem chi tiết →
          </Link>
        </div>
        <button
          type="button"
          aria-label="Đóng thông báo"
          onClick={() => setMessage(null)}
          className="h-7 w-7 rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          ×
        </button>
      </div>
    </div>
  );
}
