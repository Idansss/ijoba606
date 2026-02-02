# Ijoba606 Mobile App (Flutter)

This is a Flutter mobile client for **Ijoba606**, designed to use the **same Firebase project and Firestore data** as the existing web app.

The code in `lib/` is hand-authored here; you can later run `flutter create .` in this folder to generate full platform boilerplate (Android/iOS/web) if needed.

## 1. Requirements

- Flutter SDK installed (3.x+)
- Same Firebase project as the web app

## 2. Wire up Firebase to match the web app

Your web app uses:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

To connect the Flutter app to the **same** backend:

1. Open `lib/firebase_options.dart`.
2. Replace the placeholder values in `DefaultFirebaseOptions.web` with your real config.
   - You can copy these from:
     - Your existing `.env` (those `NEXT_PUBLIC_FIREBASE_*` values), or
     - Firebase Console → Project settings → General → Web app config.

Once filled in, the app will talk to the exact same Firestore collections (`forumThreads`, `forumPosts`, etc.).

## 3. Running the app

From the `mobile-app` folder:

```bash
flutter pub get
flutter run
```

If this folder was not created with `flutter create` yet, you can:

```bash
flutter create .
```

This keeps the existing `lib/` and `pubspec.yaml` and generates Android/iOS/web platform shells around it.

## 4. Features implemented so far

- **Auth gate**
  - Uses `FirebaseAuth.instance.authStateChanges()` in `lib/main.dart`.
  - Shows `SignInScreen` (email/password) when no user is signed in.
  - Shows `ThreadListScreen` when signed in.

- **Forum**
  - `forumThreads` list:
    - Screen: `lib/screens/forum/thread_list_screen.dart`
    - Streams from `forumThreads` ordered by `createdAt` (same shape as `ForumThread` in the web app).
  - Thread detail + replies:
    - Screen: `lib/screens/forum/thread_detail_screen.dart`
    - Reads a single thread document and its `forumPosts` (by `tid`).
    - Lets a signed-in user post a simple text reply (writes to `forumPosts`).

You can iteratively extend this to match more of the web features (leaderboard, consultants, dashboard, etc.) while staying on the same Firebase project.

