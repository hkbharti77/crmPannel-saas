import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { apiFetch } from './api';

// Config loaded from Vite environment variables with graceful fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyApiKeyForClientInit",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "crmlite-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "crmlite-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "crmlite-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456"
};

const VAPID_KEY = import.meta.env.VITE_VAPID_KEY || import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

export function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

/**
 * Returns stable unique Installation ID for this browser instance.
 */
export function getOrCreateInstallationId(): string {
  const STORAGE_KEY = 'crmlite_device_installation_id';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = 'browser_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

/**
 * Detects browser and OS for display in settings.
 */
function getBrowserDetails(): { browser: string; deviceName: string } {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Desktop';

  if (ua.includes('Chrome') && !ua.includes('Edg/')) browser = 'Google Chrome';
  else if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';

  if (ua.includes('Windows')) os = 'Windows PC';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android Device';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Device';
  else if (ua.includes('Linux')) os = 'Linux';

  return {
    browser,
    deviceName: `${os} (${browser})`
  };
}

/**
 * Requests browser push permission, retrieves FCM token, and registers device with CRMLite backend.
 */
export async function requestAndRegisterDevice(): Promise<{
  success: boolean;
  permission: NotificationPermission;
  token?: string;
  installationId?: string;
  error?: string;
}> {
  if (!('Notification' in window)) {
    return { success: false, permission: 'denied', error: 'Notifications are not supported in this browser' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, permission, error: 'Push notification permission was denied by user' };
    }

    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      return { success: false, permission, error: 'Firebase Cloud Messaging is not supported in this browser environment' };
    }

    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    // Register service worker if not already registered
    let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY || undefined,
      serviceWorkerRegistration
    });

    if (!token) {
      return { success: false, permission, error: 'No FCM registration token received' };
    }

    const installationId = getOrCreateInstallationId();
    const { browser, deviceName } = getBrowserDetails();

    // Register token with backend
    await apiFetch('/api/v1/user/devices', {
      method: 'POST',
      body: JSON.stringify({
        installationId,
        fcmToken: token,
        platform: 'WEB',
        browser,
        deviceName
      })
    });

    return {
      success: true,
      permission,
      token,
      installationId
    };
  } catch (err: any) {
    console.error('[Firebase] Push registration error: ', err);
    return {
      success: false,
      permission: Notification.permission,
      error: err?.message || 'Failed to initialize push notifications'
    };
  }
}

/**
 * Subscribes to foreground push notifications (received when app tab is open).
 */
export async function setupForegroundNotifications(onReceive: (payload: any) => void) {
  try {
    const supported = await isSupported();
    if (!supported) return;

    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    onMessage(messaging, (payload) => {
      console.log('[Firebase] Foreground notification received: ', payload);
      onReceive(payload);
    });
  } catch (e) {
    console.debug('[Firebase] Foreground messaging listener deferred: ', e);
  }
}
