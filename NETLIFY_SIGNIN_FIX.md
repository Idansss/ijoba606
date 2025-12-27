# Netlify Sign-In Fix Guide

## Issue
Sign-in feature not working on Netlify deployment.

## Root Causes & Fixes Applied

### 1. Firebase Initialization
- **Problem**: Firebase was throwing errors in production, preventing initialization
- **Fix**: Changed error handling to log errors instead of throwing in production
- **File**: `lib/firebase/config.ts`

### 2. Better Error Messages
- **Problem**: Generic error messages didn't help debug Firebase config issues
- **Fix**: Added specific error messages for different failure scenarios
- **Files**: `lib/firebase/auth.ts`, `components/layout/Header.tsx`

## Netlify Configuration Checklist

### Required Environment Variables
Make sure these are set in Netlify Dashboard → Site Settings → Environment Variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_LEADERBOARD_ENABLED=true
```

### Firebase Console Settings

1. **Authentication → Sign-in method**:
   - ✅ Enable **Anonymous** authentication
   - ✅ Enable **Google** authentication
   - Add your Netlify domain to authorized domains:
     - `your-site.netlify.app`
     - `your-custom-domain.com` (if applicable)

2. **Firestore Database**:
   - ✅ Database must be created
   - ✅ Security rules deployed (use `firebase deploy --only firestore:rules`)

3. **Authorized Domains**:
   - Go to Authentication → Settings → Authorized domains
   - Add: `your-site.netlify.app`
   - Add: `localhost` (for local testing)

## Testing Sign-In

1. **Anonymous Sign-In**:
   - Click "Try Demo" button
   - Should create anonymous user and redirect

2. **Google Sign-In**:
   - Click "Sign in" button
   - Should open Google popup
   - After authorization, should redirect back

## Common Issues

### "Authentication is not configured"
- **Cause**: Missing or incorrect Firebase environment variables
- **Fix**: Verify all `NEXT_PUBLIC_FIREBASE_*` vars are set correctly in Netlify

### "Popup was blocked"
- **Cause**: Browser blocking popups
- **Fix**: Allow popups for your Netlify domain

### "Sign-in cancelled"
- **Cause**: User closed the popup (not an error)
- **Fix**: This is expected behavior, no action needed

### Firebase errors in console
- **Cause**: Firebase not initialized properly
- **Fix**: Check browser console for specific Firebase errors, verify env vars

## Debug Steps

1. Check Netlify build logs for Firebase initialization errors
2. Check browser console on deployed site for Firebase errors
3. Verify environment variables are set (not showing as `undefined`)
4. Test Firebase connection: Open browser console and check if `firebase` is available
5. Check Firebase Console → Authentication → Users to see if sign-ins are being attempted

## Additional Notes

- The app will gracefully handle missing Firebase config (shows error messages instead of crashing)
- All Firebase operations now have proper null checks
- Error messages are user-friendly and actionable

