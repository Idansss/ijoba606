// Firebase Cloud Messaging service worker for push notifications
// Config must match your Firebase project (from .env.local NEXT_PUBLIC_FIREBASE_*)
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA8I8fivXfBEhkbVnC5pNbbTfhKlf_nV8c',
  authDomain: 'ijoba606-778a1.firebaseapp.com',
  projectId: 'ijoba606-778a1',
  storageBucket: 'ijoba606-778a1.firebasestorage.app',
  messagingSenderId: '687205974813',
  appId: '1:687205974813:web:7b456917b95a97a6a097f4',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'IJOBA 606';
  const options = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.ico',
    data: payload.data || {},
  };
  return self.registration.showNotification(title, options);
});
