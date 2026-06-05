/**
 * usePushNotifications
 *
 * Registers the service worker, subscribes to Web Push using the VAPID
 * public key from the backend, and saves the subscription via tRPC.
 *
 * Returns:
 *   isSupported  — true if the browser supports push notifications
 *   permission   — "default" | "granted" | "denied"
 *   isSubscribed — true if a push subscription is active
 *   subscribe()  — request permission and subscribe
 *   unsubscribe()— remove the current subscription
 */
import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output as Uint8Array<ArrayBuffer>;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const { data: vapidData } = trpc.push.vapidKey.useQuery();
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();

  // Register service worker and check existing subscription
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setIsSupported(true);
    setPermission(Notification.permission);

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        setRegistration(reg);
        const existing = await reg.pushManager.getSubscription();
        setIsSubscribed(!!existing);
      })
      .catch((err) => console.error("[SW] Registration failed:", err));
  }, []);

  const subscribe = useCallback(async () => {
    if (!registration || !vapidData?.publicKey) return;

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return;

    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });

      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

      await subscribeMutation.mutateAsync({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        label: navigator.userAgent.slice(0, 100),
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error("[Push] Subscribe failed:", err);
    }
  }, [registration, vapidData, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    if (!registration) return;
    const sub = await registration.pushManager.getSubscription();
    if (!sub) return;

    try {
      await unsubscribeMutation.mutateAsync({ endpoint: sub.endpoint });
      await sub.unsubscribe();
      setIsSubscribed(false);
    } catch (err) {
      console.error("[Push] Unsubscribe failed:", err);
    }
  }, [registration, unsubscribeMutation]);

  return { isSupported, permission, isSubscribed, subscribe, unsubscribe };
}
