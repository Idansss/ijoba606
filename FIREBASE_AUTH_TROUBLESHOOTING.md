# Firebase Authorization Error - Troubleshooting Guide

## Common Authorization Errors

### Error: "auth/unauthorized-domain"
**Cause**: Your Netlify domain is not in Firebase's authorized domains list.

**Fix**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your Netlify domain:
   - `your-site.netlify.app` (your actual Netlify subdomain)
   - `your-custom-domain.com` (if you have a custom domain)
6. Click **Add**
7. Wait a few minutes for changes to propagate

### Error: "auth/operation-not-allowed"
**Cause**: Google sign-in provider is not enabled.

**Fix**:
1. Go to **Authentication** → **Sign-in method**
2. Find **Google** in the list
3. Click on it
4. Toggle **Enable** to ON
5. Enter a **Project support email**
6. Click **Save**

### Error: "auth/popup-blocked" or "auth/redirect-cancelled-by-user"
**Cause**: Browser blocking popups or user cancelling.

**Fix**: 
- The app now automatically falls back to redirect flow
- User will be redirected to Google sign-in page
- After signing in, they'll be redirected back to your site

### Error: "auth/configuration-not-found"
**Cause**: Firebase config values are incorrect or missing.

**Fix**:
1. Verify all environment variables in Netlify Dashboard
2. Check that `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` matches your Firebase project
3. Ensure no typos in environment variable names

## Step-by-Step Firebase Setup for Netlify

### 1. Verify Environment Variables in Netlify

Go to Netlify Dashboard → Site Settings → Environment Variables and verify:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza... (should start with AIza)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789 (numbers only)
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc... (format: 1:numbers:web:letters)
```

**Important**: 
- All values must be set
- No quotes around values
- No spaces before/after values
- After adding/updating, trigger a new deploy

### 2. Add Authorized Domains in Firebase

1. Firebase Console → Your Project
2. **Authentication** → **Settings** tab
3. Scroll to **Authorized domains**
4. Click **Add domain**
5. Add these domains (one at a time):
   - `localhost` (for local testing)
   - `your-site.netlify.app` (your actual Netlify subdomain)
   - `your-custom-domain.com` (if applicable)
   - `*.netlify.app` (wildcard - covers all Netlify previews)

### 3. Enable Google Sign-In Provider

1. **Authentication** → **Sign-in method**
2. Click on **Google**
3. Toggle **Enable** to ON
4. Enter **Project support email** (your email)
5. Click **Save**

### 4. Verify OAuth Consent Screen (Google Cloud)

If you still get errors, check Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Verify:
   - **User Type**: External (for public apps)
   - **App name**: Your app name
   - **Support email**: Your email
   - **Authorized domains**: Should include your Netlify domain
5. Add **Test users** if app is in testing mode

### 5. Check Firebase Project Settings

1. Firebase Console → **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Verify your web app is registered
4. Check that the config values match your Netlify environment variables

## Testing the Fix

### Local Testing
1. Run `npm run dev`
2. Open browser console (F12)
3. Try signing in
4. Check console for any Firebase errors
5. Verify environment variables are loaded (check Network tab for Firebase requests)

### Netlify Testing
1. Deploy to Netlify
2. Open your Netlify site
3. Open browser console (F12)
4. Try signing in
5. Check console for specific error codes
6. Check Network tab → Look for Firebase requests → Check response for errors

## Debugging Steps

### 1. Check if Firebase is Initialized
Open browser console on your Netlify site and run:
```javascript
// Check if Firebase is available
console.log('Firebase config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});
```

### 2. Check Authorized Domains
In Firebase Console → Authentication → Settings, verify your Netlify domain is listed.

### 3. Check Error Code
When sign-in fails, check the browser console for the exact error code:
- `auth/unauthorized-domain` → Domain not authorized
- `auth/operation-not-allowed` → Provider not enabled
- `auth/popup-blocked` → Popup blocked (will auto-fallback to redirect)
- `auth/network-request-failed` → Network issue
- `auth/internal-error` → Firebase internal error

### 4. Verify Redirect URIs
For Google OAuth, Firebase automatically handles redirect URIs, but verify:
- Your `authDomain` in config matches your Firebase project
- No typos in the domain name

## Quick Checklist

- [ ] All `NEXT_PUBLIC_FIREBASE_*` env vars set in Netlify
- [ ] Netlify domain added to Firebase authorized domains
- [ ] Google sign-in provider enabled in Firebase
- [ ] Anonymous sign-in provider enabled (if using)
- [ ] OAuth consent screen configured in Google Cloud
- [ ] New deploy triggered after adding domain
- [ ] Browser console checked for specific error codes
- [ ] No typos in environment variable names

## Still Not Working?

1. **Clear browser cache** and try again
2. **Try incognito/private mode** to rule out extensions
3. **Check Firebase Console → Authentication → Users** to see if sign-in attempts are being logged
4. **Verify the exact error message** in browser console
5. **Check Netlify build logs** for any Firebase initialization errors
6. **Test with a different browser** to rule out browser-specific issues

## Additional Notes

- Changes to authorized domains can take a few minutes to propagate
- Always trigger a new Netlify deploy after changing environment variables
- The app now supports both popup and redirect flows automatically
- Check browser console for detailed error messages

