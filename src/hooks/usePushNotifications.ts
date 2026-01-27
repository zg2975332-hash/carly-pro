import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9fMrxzLWkhE3E0Fl4FTXB7NxPLRBNRVWNcEKoVCLB6F_3-kVCfJ0";

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const registerServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers not supported");
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return registration;
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return false;
    }

    setLoading(true);
    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        toast.error("Notification permission denied");
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Get subscription keys
      const p256dh = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");

      if (!p256dh || !auth) {
        throw new Error("Failed to get subscription keys");
      }

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
        auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
      }, {
        onConflict: "endpoint",
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Push notifications enabled!");
      return true;
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to enable notifications");
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", subscription.endpoint);
        }
      }

      setIsSubscribed(false);
      toast.success("Push notifications disabled");
      return true;
    } catch (error: any) {
      console.error("Unsubscribe error:", error);
      toast.error("Failed to disable notifications");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const showLocalNotification = useCallback(async (title: string, body: string, data?: Record<string, unknown>) => {
    if (permission !== "granted") {
      const result = await Notification.requestPermission();
      if (result !== "granted") return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      // Use type assertion for extended notification options
      const options = {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data,
        tag: (data?.id as string) || "notification",
      };
      await registration.showNotification(title, options);
    } catch {
      // Fallback to basic notification
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }, [permission]);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    showLocalNotification,
  };
};