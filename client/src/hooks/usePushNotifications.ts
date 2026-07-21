import { useCallback } from "react";
import axiosClient from "@/api/axiosClient";
import { getDeviceLabel } from "@/utils/deviceInfo";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotifications() {
  const requestPermissionAndSubscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported in this browser");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const existingSubscription =
      await registration.pushManager.getSubscription();
    const subscription =
      existingSubscription ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY,
        ),
      }));

    const subJson = subscription.toJSON();
    const { label, browser, os } = getDeviceLabel();

    await axiosClient.post("/push/subscribe", {
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      deviceLabel: label,
      browserName: browser,
      osName: os,
    });

    return true;
  }, []);

  return { requestPermissionAndSubscribe };
}
