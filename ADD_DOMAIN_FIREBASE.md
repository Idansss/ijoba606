# How to Add Domain to Firebase Authorized Domains

## Exact Steps for `ijoba606.com`

The error message says: **"Add your domain (ijoba606.com) to the OAuth redirect domains list"**

### Step-by-Step Instructions:

1. **Go to Firebase Console**
   - Open: https://console.firebase.google.com
   - Select your Firebase project

2. **Navigate to Authentication Settings**
   - Click **Authentication** in the left sidebar
   - Click the **Settings** tab (not "Sign-in method")
   - Scroll down to the **Authorized domains** section

3. **Add the Domain**
   - Click the **Add domain** button
   - Enter exactly: `ijoba606.com`
   - **Important**: 
     - No `http://` or `https://`
     - No `www.` prefix (unless you want `www.ijoba606.com` separately)
     - Just the domain: `ijoba606.com`
   - Click **Add**

4. **Also Add Your Netlify Subdomain** (if applicable)
   - If your site is also accessible via Netlify subdomain (e.g., `your-site.netlify.app`)
   - Add that domain too: `your-site.netlify.app`
   - This ensures sign-in works on both domains

5. **Wait for Propagation**
   - Changes can take **2-5 minutes** to propagate
   - Don't test immediately - wait a few minutes

6. **Verify the Domain is Added**
   - You should see `ijoba606.com` in the list of authorized domains
   - The list should show:
     - `localhost` (for local testing)
     - `ijoba606.com` (your custom domain)
     - `your-site.netlify.app` (if you added it)

## Common Mistakes to Avoid

❌ **Don't add**: `https://ijoba606.com` (remove protocol)  
❌ **Don't add**: `www.ijoba606.com` (unless you specifically use www)  
❌ **Don't add**: `ijoba606.com/` (no trailing slash)  
✅ **Do add**: `ijoba606.com` (just the domain)

## If You Have Both www and non-www

If your site works on both `ijoba606.com` and `www.ijoba606.com`, add both:
- `ijoba606.com`
- `www.ijoba606.com`

## After Adding the Domain

1. **Wait 2-5 minutes** for Firebase to update
2. **Clear your browser cache** or use incognito mode
3. **Try signing in again** on `ijoba606.com`
4. **Check browser console** - the error should be gone

## Still Not Working?

If you've added the domain and waited 5+ minutes but still get the error:

1. **Double-check the exact domain**:
   - Open your site in browser
   - Check the address bar - what's the exact domain?
   - Make sure it matches exactly what you added in Firebase

2. **Check for typos**:
   - Is it `ijoba606.com` or `ijoba-606.com`?
   - Is it `ijoba606.com` or `ijoba606.net`?
   - The domain must match exactly

3. **Verify in Firebase Console**:
   - Go back to Authentication → Settings → Authorized domains
   - Confirm `ijoba606.com` is in the list
   - If it's not there, you may have added it to the wrong project

4. **Check if you have multiple Firebase projects**:
   - Make sure you're adding the domain to the **same project** that your Netlify environment variables point to
   - Check `NEXT_PUBLIC_FIREBASE_PROJECT_ID` in Netlify matches the project you're editing

## Quick Checklist

- [ ] Opened Firebase Console → Your Project
- [ ] Went to Authentication → Settings tab
- [ ] Scrolled to "Authorized domains" section
- [ ] Clicked "Add domain"
- [ ] Entered exactly: `ijoba606.com` (no http, no www, no trailing slash)
- [ ] Clicked "Add"
- [ ] Verified `ijoba606.com` appears in the list
- [ ] Waited 2-5 minutes
- [ ] Cleared browser cache
- [ ] Tested sign-in again

