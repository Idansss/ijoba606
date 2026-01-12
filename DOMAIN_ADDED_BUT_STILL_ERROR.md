# Domain Added But Still Getting Error - Troubleshooting

## Your Situation
✅ Domain `ijoba606.com` is already in Firebase authorized domains  
❌ Still getting `auth/unauthorized-domain` error

## Most Likely Causes

### 1. Wrong Firebase Project (Most Common)

Your Firebase project appears to be: **`ijoba606-778a1`** (based on the default domains shown)

**Check Netlify Environment Variables:**
1. Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
2. Verify `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches your Firebase project
3. It should be: `ijoba606-778a1` (or whatever your actual project ID is)
4. Verify `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` matches: `ijoba606-778a1.firebaseapp.com`

**If they don't match:**
- You're using a different Firebase project in Netlify than the one where you added the domain
- Update Netlify environment variables to match the correct project
- OR add the domain to the project that Netlify is actually using

### 2. Propagation Delay

Firebase changes can take **5-10 minutes** to propagate globally.

**What to do:**
1. Wait 10 minutes after adding the domain
2. Clear browser cache completely (Ctrl+Shift+Delete)
3. Try in incognito/private mode
4. Try a different browser

### 3. Browser Cache

The error might be cached in your browser.

**Quick Fix:**
1. Open your site in **Incognito/Private mode**
2. Try signing in
3. If it works in incognito, clear your browser cache

**Full Cache Clear:**
- Chrome/Edge: Ctrl+Shift+Delete → Select "All time" → Clear
- Firefox: Ctrl+Shift+Delete → Select "Everything" → Clear

### 4. Verify Environment Variables Match

**In Netlify Dashboard:**
Check that these match your Firebase project (from the screenshot, project appears to be `ijoba606-778a1`):

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ijoba606-778a1
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ijoba606-778a1.firebaseapp.com
```

**To verify your Firebase project:**
1. Go to Firebase Console
2. Click the gear icon (Project Settings)
3. Check the "Project ID" - it should match what's in Netlify

### 5. Trigger New Netlify Deploy

After verifying environment variables:
1. Go to Netlify Dashboard → Deploys
2. Click "Trigger deploy" → "Clear cache and deploy site"
3. Wait for deploy to complete
4. Test sign-in again

## Step-by-Step Verification

### Step 1: Verify Firebase Project
1. Firebase Console → Your Project
2. Project Settings (gear icon) → General tab
3. Note the **Project ID** (should be `ijoba606-778a1` or similar)

### Step 2: Verify Netlify Environment Variables
1. Netlify Dashboard → Site Settings → Environment Variables
2. Check `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches Step 1
3. Check `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` matches `{project-id}.firebaseapp.com`

### Step 3: Verify Domain is in Correct Project
1. Firebase Console → Authentication → Settings → Authorized domains
2. Confirm `ijoba606.com` is listed
3. Make sure you're looking at the **same project** from Step 1

### Step 4: Clear Cache and Retry
1. Wait 10 minutes (if you just added the domain)
2. Clear browser cache
3. Try in incognito mode
4. Trigger new Netlify deploy

## Quick Test

Open browser console on your Netlify site and run:
```javascript
// Check what Firebase project is being used
console.log('Firebase Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('Firebase Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('Current Domain:', window.location.hostname);
```

Compare these values:
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` should match your Firebase project ID
- `window.location.hostname` should be `ijoba606.com` (or match what you added)
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` should be `{project-id}.firebaseapp.com`

## Still Not Working?

If after 10+ minutes and clearing cache it still doesn't work:

1. **Double-check you're editing the right Firebase project**
   - The project ID in Netlify must match the project where you added the domain

2. **Try removing and re-adding the domain**
   - Firebase Console → Authentication → Settings → Authorized domains
   - Remove `ijoba606.com`
   - Wait 2 minutes
   - Add it back
   - Wait 10 minutes

3. **Check for typos**
   - Domain in Firebase: `ijoba606.com` (exactly as shown)
   - No `www.`, no `http://`, no trailing slash

4. **Verify Google Sign-In is enabled**
   - Authentication → Sign-in method → Google → Should be Enabled

5. **Check OAuth Consent Screen** (if still failing)
   - Google Cloud Console → Your Project → APIs & Services → OAuth consent screen
   - Verify authorized domains include `ijoba606.com`

## Expected Behavior After Fix

Once working:
- Sign-in should work without `auth/unauthorized-domain` error
- You'll be redirected to Google sign-in page
- After signing in, you'll be redirected back to your site
- No errors in browser console

