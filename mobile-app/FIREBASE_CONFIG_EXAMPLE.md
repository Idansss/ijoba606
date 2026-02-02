# Firebase Config - Visual Example

## What is "Step 2"?

**Step 2** means: **Replace the placeholder text in `firebase_options.dart` with your real Firebase values.**

---

## Before (What you see now):

```dart
static const FirebaseOptions web = FirebaseOptions(
  apiKey: 'YOUR_FIREBASE_API_KEY_HERE',           // ❌ Placeholder
  authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN_HERE',  // ❌ Placeholder
  projectId: 'YOUR_FIREBASE_PROJECT_ID_HERE',    // ❌ Placeholder
  storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET_HERE',  // ❌ Placeholder
  messagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE',  // ❌ Placeholder
  appId: 'YOUR_FIREBASE_APP_ID_HERE',            // ❌ Placeholder
);
```

---

## After (What it should look like):

```dart
static const FirebaseOptions web = FirebaseOptions(
  apiKey: 'AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz',  // ✅ Your real API key
  authDomain: 'ijoba606.firebaseapp.com',                  // ✅ Your real domain
  projectId: 'ijoba606',                                    // ✅ Your real project ID
  storageBucket: 'ijoba606.appspot.com',                   // ✅ Your real bucket
  messagingSenderId: '123456789012',                        // ✅ Your real sender ID
  appId: '1:123456789012:web:abcdef123456',                 // ✅ Your real app ID
);
```

**Note:** The example values above are fake. Use YOUR actual values from Firebase Console or your .env file.

---

## How to Do It:

1. **Get your values** from Firebase Console (see `FIREBASE_SETUP.md` for detailed steps)

2. **Open** `mobile-app/lib/firebase_options.dart`

3. **Find** the section that says `static const FirebaseOptions web = FirebaseOptions(`

4. **Replace** each line:
   - Find `'YOUR_FIREBASE_API_KEY_HERE'`
   - Delete it
   - Type `'` (single quote)
   - Paste your actual API key
   - Type `'` (single quote) again
   - Add a comma `,` at the end

5. **Repeat** for all 6 values

6. **Save** the file

---

## Quick Checklist:

- [ ] Opened `mobile-app/lib/firebase_options.dart`
- [ ] Found the `FirebaseOptions web` section
- [ ] Got my Firebase values (from Console or .env)
- [ ] Replaced `apiKey` placeholder with real value
- [ ] Replaced `authDomain` placeholder with real value
- [ ] Replaced `projectId` placeholder with real value
- [ ] Replaced `storageBucket` placeholder with real value
- [ ] Replaced `messagingSenderId` placeholder with real value
- [ ] Replaced `appId` placeholder with real value
- [ ] All values are wrapped in single quotes `'...'`
- [ ] Saved the file
- [ ] No placeholder text remains

---

## Still Confused?

**Step 2 is simply:** 
1. Open the file
2. Find the placeholders (text that says `YOUR_FIREBASE_...`)
3. Replace them with your real Firebase values
4. Save

That's it! 🎯
