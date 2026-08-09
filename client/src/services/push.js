import { savePushSubscription, deletePushSubscription } from './api';

const VAPID_PUBLIC_KEY = 'BMMhz9kqwsLbT7m64p53rhSi0u8glqIjs89F3L5xgplD92qjFakmi6MUXZc56xId8ynYdmrVI8SFH2ECsKnvoaE';

export function isPushSupported() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window;
}

export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.register('/sw.js');
  return registration;
}

export async function enablePushNotifications() {
  if (!isPushSupported()) return { granted: false, reason: 'unsupported' };

  const registration = await navigator.serviceWorker.ready;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { granted: false, reason: permission };

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  await savePushSubscription(subscription);
  return { granted: true };
}

export async function disablePushNotifications() {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await deletePushSubscription(subscription.endpoint).catch(() => {});
    await subscription.unsubscribe();
  }
}

export async function getPushStatus() {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) return 'enabled';
  return 'default';
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
