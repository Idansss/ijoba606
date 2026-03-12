/**
 * Firebase Cloud Messaging – request permission, get token, save to Firestore
 */
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from './config';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

let messaging: Messaging | null = null;

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  return isSupported();
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.requestPermission();
}

export async function getFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !app || !VAPID_KEY) return null;

  try {
    const supported = await isSupported();
    if (!supported) return null;

    if (!messaging) {
      messaging = getMessaging(app);
    }

    let registration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch (err) {
    console.warn('FCM getToken failed:', err);
    return null;
  }
}

export async function saveFCMTokenToFirestore(uid: string, token: string): Promise<void> {
  if (!db) return;

  try {
    const tokenRef = doc(db, 'users', uid, 'fcmTokens', token);
    await setDoc(tokenRef, { token, updatedAt: new Date() }, { merge: true });
  } catch (err) {
    console.warn('Failed to save FCM token:', err);
  }
}

export async function registerFCMToken(uid: string): Promise<boolean> {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return false;

  const token = await getFCMToken();
  if (!token) return false;

  await saveFCMTokenToFirestore(uid, token);
  return true;
}
