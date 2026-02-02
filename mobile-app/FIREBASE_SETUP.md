# Firebase Configuration Guide for Mobile App

This guide will help you copy your Firebase config from your web app to the Flutter mobile app.

## Step 1: Get Your Firebase Config Values

You have **two options** to get your Firebase config:

### Option A: From Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **Ijoba606 project**
3. Click the **gear icon** (⚙️) next to "Project Overview" → Select **"Project settings"**
4. Scroll down to the **"Your apps"** section
5. Look for your **Web app** (or click **"Add app"** → **Web** if you don't have one)
6. You'll see a config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Copy these values** - you'll need them in Step 2.

### Option B: From Your Web App's Environment Variables

If you have a `.env.local` or `.env` file in your web app root:

1. Open the file `c:\MAMP\htdocs\ijoba606\.env.local` (or `.env`)
2. Look for these lines:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```
3. Copy the values (the part after the `=` sign)

---

## Step 2: Update `firebase_options.dart`

1. Open the file: `mobile-app/lib/firebase_options.dart`

2. Find this section (around line 32):

```dart
static const FirebaseOptions web = FirebaseOptions(
  apiKey: 'YOUR_FIREBASE_API_KEY_HERE',
  authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN_HERE',
  projectId: 'YOUR_FIREBASE_PROJECT_ID_HERE',
  storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET_HERE',
  messagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE',
  appId: 'YOUR_FIREBASE_APP_ID_HERE',
);
```

3. Replace each placeholder with your actual values:

   - **If using Firebase Console (Option A):**
     - `apiKey` → Copy the `apiKey` value from Firebase Console
     - `authDomain` → Copy the `authDomain` value
     - `projectId` → Copy the `projectId` value
     - `storageBucket` → Copy the `storageBucket` value
     - `messagingSenderId` → Copy the `messagingSenderId` value
     - `appId` → Copy the `appId` value

   - **If using .env file (Option B):**
     - `apiKey` → Copy from `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `authDomain` → Copy from `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `projectId` → Copy from `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `storageBucket` → Copy from `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `messagingSenderId` → Copy from `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `appId` → Copy from `NEXT_PUBLIC_FIREBASE_APP_ID`

4. **Important:** Keep the quotes around each value! Example:

```dart
static const FirebaseOptions web = FirebaseOptions(
  apiKey: 'AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef123456',
);
```

---

## Step 3: Verify Your Config

After updating, your `firebase_options.dart` should look something like this (with YOUR actual values):

```dart
static const FirebaseOptions web = FirebaseOptions(
  apiKey: 'AIzaSy...',  // Your actual API key
  authDomain: 'ijoba606.firebaseapp.com',  // Your actual domain
  projectId: 'ijoba606',  // Your actual project ID
  storageBucket: 'ijoba606.appspot.com',  // Your actual bucket
  messagingSenderId: '123456789',  // Your actual sender ID
  appId: '1:123456789:web:abc123',  // Your actual app ID
);
```

**Make sure:**
- ✅ No placeholder text like `YOUR_FIREBASE_...` remains
- ✅ All values are wrapped in single quotes `'...'`
- ✅ There's a comma after each line (except the last one)
- ✅ No extra spaces or typos

---

## Step 4: Test the App

1. Save the file (`Ctrl+S` or `Cmd+S`)
2. Run the app:
   ```bash
   cd mobile-app
   flutter clean
   flutter pub get
   flutter run
   ```

3. The app should now:
   - Show the animated "IJOBA 606" splash screen
   - Navigate to the sign-in screen or main app
   - **NOT** show a black screen or error message

---

## Troubleshooting

### Still seeing a black screen?

1. **Check for typos** - Make sure you copied the values correctly
2. **Check quotes** - All values must be in single quotes `'...'`
3. **Check Firebase Console** - Make sure your Firebase project is active
4. **Check logs** - Run `flutter run` in terminal to see error messages

### Getting "Firebase Not Configured" error?

- This means the app detected placeholder values
- Go back to Step 2 and make sure you replaced ALL placeholders

### Need help finding your Firebase project?

1. Check your web app's `lib/firebase/config.ts` file
2. Look at your deployed web app's network requests (in browser DevTools)
3. Check your Firebase Console for the project name

---

## Quick Reference: Mapping

| Firebase Console / .env | Flutter firebase_options.dart |
|------------------------|------------------------------|
| `apiKey` | `apiKey: '...'` |
| `authDomain` | `authDomain: '...'` |
| `projectId` | `projectId: '...'` |
| `storageBucket` | `storageBucket: '...'` |
| `messagingSenderId` | `messagingSenderId: '...'` |
| `appId` | `appId: '...'` |

---

**That's it!** Once configured, your mobile app will use the same Firebase backend as your web app. 🎉
