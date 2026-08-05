// client/public/sw.js
self.addEventListener("push", (event) => {
  const data = event.data.json();

  // ✅ Build URL based on notification type
  let redirectUrl = "/";

  if (data.data?.conversationId) {
    redirectUrl = `/chat/${data.data.conversationId}`;
  } else if (data.data?.type === "call") {
    redirectUrl = `/call/${data.data.callId}`;
  } else if (data.data?.type === "group") {
    redirectUrl = `/groups/${data.data.groupId}`;
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: "/badge-72.png",
    data: {
      ...data.data,
      url: data.data?.url || redirectUrl,
      chatId: data.data?.conversationId,
    },
    tag: data.data?.conversationId || data.data?.tag || "default",
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: "open",
        title: "Open Chat",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  // ✅ Handle notification actions
  if (action === "dismiss") {
    return; // Just close notification
  }

  // Get URL from notification data
  let url = notificationData?.url || "/";

  // ✅ Add query params for tracking
  if (notificationData?.chatId) {
    url = `/chat/${notificationData.chatId}?from=notification&t=${Date.now()}`;
  }

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Find existing client
        let existingClient = null;

        for (const client of clientList) {
          // If same URL or chat page
          if (client.url.includes(`/chat/${notificationData?.chatId}`)) {
            existingClient = client;
            break;
          }
          // If any chat page is open
          if (client.url.includes("/chat/") && !existingClient) {
            existingClient = client;
          }
        }

        if (existingClient) {
          // Focus existing client
          existingClient.focus();
          // Navigate to specific chat if different
          if (
            !existingClient.url.includes(`/chat/${notificationData?.chatId}`)
          ) {
            existingClient.navigate(url);
          }
          return;
        }

        // Open new window if no client found
        return self.clients.openWindow(url);
      }),
  );
});

// ✅ Handle push subscription
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    // Send new subscription to server
    fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription: event.newSubscription,
      }),
    }),
  );
});

// ✅ Handle service worker installation
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

// ✅ Handle service worker activation
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
