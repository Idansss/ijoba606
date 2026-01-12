# Fix Firebase Project Mismatch

## The Problem

Your Firebase Console screenshot shows project **`ijoba606-778a1`** (you can see domains like `ijoba606-778a1.firebaseapp.com`), but your `.firebaserc` file shows project **`ijoba-606`**.

This means:
- You added `ijoba606.com` to project **`ijoba606-778a1`** ✅
- But Netlify might be using project **`ijoba-606`** ❌
- So the domain isn't authorized in the project Netlify is actually using!

## Solution: Verify and Fix Netlify Environment Variables

### Step 1: Check Which Project Has the Domain

From your screenshot, the project where you added the domain is: **`ijoba606-778a1`**

You can confirm this by:
1. Firebase Console → Project Settings (gear icon)
2. Check the **Project ID** - it should be `ijoba606-778a1`

### Step 2: Get the Correct Firebase Config

1. In Firebase Console, make sure you're in project **`ijoba606-778a1`** (the one with the authorized domain)
2. Go to **Project Settings** (gear icon) → **General** tab
3. Scroll to **"Your apps"** section
4. If you don't have a web app registered, click the **web icon** `</>` and register one
5. Copy the **entire config object** - it should look like:

```javascript
{
  apiKey: "AIza...",
  authDomain: "ijoba606-778a1.firebaseapp.com",
  projectId: "ijoba606-778a1",
  storageBucket: "ijoba606-778a1.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
}
```

### Step 3: Update Netlify Environment Variables

1. Go to **Netlify Dashboard** → Your Site → **Site Settings** → **Environment Variables**
2. Update these variables to match the project where the domain is authorized:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza... (from step 2)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ijoba606-778a1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ijoba606-778a1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ijoba606-778a1.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789 (from step 2)
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc... (from step 2)
```

**Critical**: The `NEXT_PUBLIC_FIREBASE_PROJECT_ID` MUST be `ijoba606-778a1` (the project where you added the domain)

### Step 4: Trigger New Deploy

1. After updating environment variables, go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Wait for deployment to complete

### Step 5: Test Again

1. Clear browser cache (or use incognito mode)
2. Try signing in again
3. The error should be gone!

## Alternative: Add Domain to the Other Project

If you prefer to use project `ijoba-606` instead:

1. Switch to Firebase project **`ijoba-606`** in Firebase Console
2. Go to **Authentication** → **Settings** → **Authorized domains**
3. Add `ijoba606.com` to this project
4. Make sure Netlify environment variables point to `ijoba-606`

## How to Verify You're Using the Right Project

After updating Netlify variables, you can verify by:

1. Opening your Netlify site
2. Open browser console (F12)
3. Run this in console:
```javascript
console.log('Firebase Project:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
```

These should match:
- Project ID: `ijoba606-778a1`
- Auth Domain: `ijoba606-778a1.firebaseapp.com`

## Quick Checklist

- [ ] Identified which Firebase project has the authorized domain (`ijoba606-778a1`)
- [ ] Got Firebase config from that project
- [ ] Updated Netlify `NEXT_PUBLIC_FIREBASE_PROJECT_ID` to `ijoba606-778a1`
- [ ] Updated all other `NEXT_PUBLIC_FIREBASE_*` variables to match
- [ ] Triggered new Netlify deploy with cache clear
- [ ] Cleared browser cache
- [ ] Tested sign-in again

