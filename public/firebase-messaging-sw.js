/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

// Scripts for Firebase App and Messaging Compat
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Config populated dynamically or with fallback placeholders
const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || "AIzaSyDummyApiKeyForSWRegistration",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "crmlite.firebaseapp.com",
  projectId: self.FIREBASE_PROJECT_ID || "crmlite-app",
  storageBucket: self.FIREBASE_STORAGE_BUCKET || "crmlite-app.appspot.com",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: self.FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

try {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background push message: ', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || '🔔 CRMLite Notification';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'You have a new update in your CRM.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {},
      vibrate: [200, 100, 200]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Firebase SW initialization deferred: ', e);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (targetUrl && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
