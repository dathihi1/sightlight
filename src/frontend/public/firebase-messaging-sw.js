/* SignLight FCM service worker. Keep this file dependency-free so it can run before the app bundle. */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { data: { body: event.data.text() } };
  }

  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || data.title || "SignLight";
  const body = notification.body || data.body || "Bạn có một thông báo mới.";
  const targetUrl = safeTargetUrl(data.targetUrl || (payload.fcmOptions && payload.fcmOptions.link));

  event.waitUntil(handlePushMessage({
    notificationId: data.notificationId,
    title,
    body,
    type: data.type,
    targetUrl,
  }));
});

async function handlePushMessage(message) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const visibleWindows = windows.filter((client) => client.visibilityState === "visible");
  if (visibleWindows.length > 0) {
    visibleWindows.forEach((client) => client.postMessage({
      type: "SIGNLIGHT_FCM_MESSAGE",
      message,
    }));
    return;
  }

  await self.registration.showNotification(message.title, {
    body: message.body,
    icon: "/icon.png",
    badge: "/icon.png",
    tag: message.notificationId || undefined,
    data: {
      notificationId: message.notificationId,
      targetUrl: message.targetUrl,
    },
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = safeTargetUrl(event.notification.data && event.notification.data.targetUrl);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      const absoluteTarget = new URL(targetUrl, self.location.origin).href;
      for (const client of windows) {
        if (client.url === absoluteTarget && "focus" in client) return client.focus();
      }
      for (const client of windows) {
        if ("navigate" in client && "focus" in client) {
          await client.navigate(absoluteTarget);
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(absoluteTarget) : undefined;
    }),
  );
});

function safeTargetUrl(value) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : "/thong-bao";
}
