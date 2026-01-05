# Netlify Environment Variables - Updated Config

## Firebase Configuration from Your New Web App

Based on your Firebase web app configuration, here are the exact values to use in Netlify:

## Required Environment Variables for Netlify

Go to **Netlify Dashboard** → Your Site → **Site Settings** → **Environment Variables** and set these:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA8I8fivXfBEhkbVnC5pNbbTfhKlf_nV8c
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ijoba606-778a1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ijoba606-778a1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ijoba606-778a1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=687205974813
NEXT_PUBLIC_FIREBASE_APP_ID=1:687205974813:web:7b456917b95a97a6a097f4
NEXT_PUBLIC_LEADERBOARD_ENABLED=true
```

## Important Notes

1. **No quotes** - Don't wrap values in quotes
2. **No spaces** - No spaces before or after the `=` sign
3. **Exact match** - Copy the values exactly as shown above
4. **Project ID** - Must be `ijoba606-778a1` (matches the project where domain is authorized)

## About measurementId

The `measurementId: "G-HM6CCCX8WS"` is for Firebase Analytics. You don't need to add it as an environment variable since:
- You're already using Google Analytics (gtag.js) in your app
- Firebase Analytics is optional
- Your existing Google Analytics setup is separate

## After Updating

1. **Save** the environment variables in Netlify
2. Go to **Deploys** tab
3. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
4. Wait for deployment to complete (2-3 minutes)
5. Test sign-in - it should work now! ✅

## Verification

After deployment, you can verify the config is correct by:
1. Opening your Netlify site
2. Open browser console (F12)
3. Run:
```javascript
console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
```

Should show:
- Project ID: `ijoba606-778a1`
- Auth Domain: `ijoba606-778a1.firebaseapp.com`

## Why This Will Fix the Error

- ✅ Domain `ijoba606.com` is authorized in project `ijoba606-778a1`
- ✅ Netlify will now use project `ijoba606-778a1` (matching the authorized domain)
- ✅ Sign-in should work without `auth/unauthorized-domain` error

