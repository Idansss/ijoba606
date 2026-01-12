# Verify Firebase Project Configuration

## Important: Project ID Mismatch Detected

Your `.firebaserc` file shows project: **`ijoba-606`**  
But your Firebase Console shows project: **`ijoba606-778a1`**

This suggests you might have multiple Firebase projects or the Netlify environment variables might be pointing to a different project.

## Quick Verification Steps

### 1. Check Which Project Netlify is Using

**In Netlify Dashboard:**
1. Go to Site Settings → Environment Variables
2. Find `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. Note the value

**In Firebase Console:**
1. Go to Project Settings (gear icon)
2. Check the **Project ID** shown
3. Compare with Netlify value

**They MUST match!**

### 2. Check Which Project Has the Domain

1. In Firebase Console, switch to the project that matches your Netlify `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
2. Go to Authentication → Settings → Authorized domains
3. Verify `ijoba606.com` is in the list
4. If it's not there, you added it to the wrong project!

### 3. Fix the Mismatch

**Option A: Use the project where domain is added**
- Update Netlify environment variables to match the project where `ijoba606.com` is authorized
- Based on screenshot, this appears to be `ijoba606-778a1`

**Option B: Add domain to the project Netlify is using**
- If Netlify is using `ijoba-606`, add `ijoba606.com` to that project's authorized domains

## Correct Configuration

Your Netlify environment variables should match the Firebase project where you added the domain:

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ijoba606-778a1  (or whatever matches)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ijoba606-778a1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_API_KEY=AIza... (from the same project)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ijoba606-778a1.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=... (from the same project)
NEXT_PUBLIC_FIREBASE_APP_ID=... (from the same project)
```

## How to Get Correct Values

1. Go to Firebase Console
2. Select the project where `ijoba606.com` is authorized (likely `ijoba606-778a1`)
3. Go to Project Settings (gear icon) → General
4. Scroll to "Your apps" → Web app
5. Copy all the config values
6. Update Netlify environment variables with these values
7. Trigger a new deploy

## After Updating

1. Wait 2-3 minutes for Netlify to rebuild
2. Clear browser cache
3. Test sign-in again
4. The error should be gone!

