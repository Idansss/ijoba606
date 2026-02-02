// This file wires the Flutter app to the SAME Firebase project as your web app.
// 
// IMPORTANT:
// - Open your existing Firebase project in the Firebase Console.
// - Go to Project settings -> Your apps -> Add app (Flutter / Android / iOS / Web).
// - Copy the config values and paste them below.
//
// This mimics what `flutterfire configure` normally generates, but in a minimal form.

import 'package:firebase_core/firebase_core.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    // For now we use the same options across platforms.
    // If you need per-platform settings later, you can branch on
    // `defaultTargetPlatform` or `kIsWeb`.
    return web;
  }

  // ============================================================
  // STEP 2: Replace the placeholder values below with your real Firebase config
  // ============================================================
  //
  // HOW TO GET YOUR VALUES:
  //
  // Option 1: From Firebase Console (Easiest)
  //   1. Go to https://console.firebase.google.com/
  //   2. Select your project
  //   3. Click gear icon ⚙️ → Project settings
  //   4. Scroll to "Your apps" → Find your Web app
  //   5. Copy the values from the config object
  //
  // Option 2: From your .env.local file
  //   1. Open .env.local in your web app root folder
  //   2. Find the NEXT_PUBLIC_FIREBASE_* values
  //   3. Copy the values (the part after the = sign)
  //
  // MAPPING:
  //   Firebase Console / .env              →  Replace this value
  //   ──────────────────────────────────────────────────────────
  //   apiKey                              →  apiKey: 'paste-here'
  //   authDomain                          →  authDomain: 'paste-here'
  //   projectId                           →  projectId: 'paste-here'
  //   storageBucket                       →  storageBucket: 'paste-here'
  //   messagingSenderId                   →  messagingSenderId: 'paste-here'
  //   appId                               →  appId: 'paste-here'
  //
  // EXAMPLE (with fake values - replace with YOUR real values):
  //   apiKey: 'AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz',
  //   authDomain: 'my-project.firebaseapp.com',
  //   projectId: 'my-project-id',
  //   storageBucket: 'my-project.appspot.com',
  //   messagingSenderId: '123456789012',
  //   appId: '1:123456789012:web:abcdef123456',
  //
  // ============================================================
  
  static const FirebaseOptions web = FirebaseOptions(
    // ⬇️ REPLACE THIS with your actual API key (keep the quotes!)
    apiKey: 'YOUR_FIREBASE_API_KEY_HERE',
    
    // ⬇️ REPLACE THIS with your actual auth domain (e.g., 'my-project.firebaseapp.com')
    authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN_HERE',
    
    // ⬇️ REPLACE THIS with your actual project ID
    projectId: 'YOUR_FIREBASE_PROJECT_ID_HERE',
    
    // ⬇️ REPLACE THIS with your actual storage bucket (e.g., 'my-project.appspot.com')
    storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET_HERE',
    
    // ⬇️ REPLACE THIS with your actual messaging sender ID (numbers only, in quotes)
    messagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE',
    
    // ⬇️ REPLACE THIS with your actual app ID (e.g., '1:123456789:web:abc123')
    appId: 'YOUR_FIREBASE_APP_ID_HERE',
  );
}

