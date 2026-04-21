import { supabase } from "@/integrations/supabase/client";

export const VAPID_PUBLIC_KEY = "BM4Afj6vJJ1oMx0o_mnNXYrhap-2Ea-EA_CHGHcAzb1qMwvoRPdAAAmSWQbHZqFVaLKGuvNimULYIdrJRdcdIWs";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function registerSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (e) {
    console.warn("SW register failed", e);
    return null;
  }
}

export async function subscribePush(userId: string) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const reg = await registerSW();
  if (!reg) return false;

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON() as any;
  await supabase.from("push_subscriptions").upsert({
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent,
  }, { onConflict: "user_id,endpoint" });
  return true;
}