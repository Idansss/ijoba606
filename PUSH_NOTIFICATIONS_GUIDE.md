# Push Notifications Setup Guide

## Current State

- **In-app notifications**: ✅ Working. New chat messages create Firestore notifications.
- **Email notifications**: ✅ Working. Recipients get an email when they receive a chat message (requires `EMAIL_USER` and `EMAIL_PASSWORD` in Firebase Functions config).
- **Push notifications (browser/device)**: Requires additional setup.

## Push Notifications (Web)

To send push notifications when users are offline or not in the browser:

### 1. Firebase Cloud Messaging (FCM)

- Enable FCM in Firebase Console → Project Settings → Cloud Messaging
- Your `messagingSenderId` is already in the Firebase config

### 2. Service Worker

Create `public/firebase-messaging-sw.js`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "...",
  projectId: "...",
  messagingSenderId: "...",
  appId: "..."
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New message';
  const options = { body: payload.notification?.body };
  self.registration.showNotification(title, options);
});
```

### 3. Request Permission & Save Token

In your app, request notification permission and save the FCM token to Firestore (e.g. `users/{uid}/fcmTokens/{token}`).

### 4. Send from Cloud Function

When a new chat message is created, use `admin.messaging().send()` to send to the recipient's FCM token(s).

### 5. PWA (Optional)

For "install app" and better offline support, add a `manifest.json` and ensure the service worker is registered.
