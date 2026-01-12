# How to Deploy Firebase Functions

## Important: Netlify vs Firebase Functions

- **Netlify**: Hosts your Next.js frontend (the website)
- **Firebase Functions**: Backend functions that need to be deployed separately
- The CORS error on Netlify happens because the frontend is trying to call functions that aren't deployed yet

## Step 1: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate.

## Step 3: Verify Your Project

Make sure you're in the project root directory and check your Firebase project:

```bash
firebase projects:list
```

Your project should be `ijoba606-778a1` (as set in `.firebaserc`).

## Step 4: Deploy Functions

From the project root directory:

```bash
firebase deploy --only functions
```

This will:
1. Build the TypeScript code in `functions/`
2. Deploy all functions to Firebase
3. Make them available at: `https://us-central1-ijoba606-778a1.cloudfunctions.net/`

## Step 5: Verify Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ijoba606-778a1`
3. Go to **Functions** in the left sidebar
4. You should see:
   - `createThread`
   - `createConsultantApplication`
   - `createConsultantRequest`

## Step 6: Test from Netlify

After deployment:
1. Wait 2-3 minutes for functions to be fully available
2. Refresh your Netlify site
3. Try creating a thread
4. The CORS error should be resolved

## Troubleshooting

### If deployment fails:

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be Node 18+ (functions use Node 24)

2. **Install dependencies in functions directory:**
   ```bash
   cd functions
   npm install
   cd ..
   ```

3. **Build functions manually:**
   ```bash
   cd functions
   npm run build
   cd ..
   ```

4. **Check Firebase project:**
   ```bash
   firebase use
   ```
   Should show: `ijoba606-778a1`

### If CORS error persists after deployment:

1. **Check function region:**
   - Functions are deployed to `us-central1`
   - Client code uses `us-central1` (already configured)

2. **Check browser console:**
   - Look for the specific error message
   - The improved error detection will show if it's a CORS issue

3. **Verify function URL:**
   - Functions should be at: `https://us-central1-ijoba606-778a1.cloudfunctions.net/createThread`
   - Check if this URL is accessible

## Automatic Deployment (Optional)

If you want functions to deploy automatically when you push to GitHub:

1. **Set up GitHub Actions** (recommended):
   - Create `.github/workflows/deploy-functions.yml`
   - Add Firebase token as GitHub secret
   - Deploy on push to main

2. **Or use Firebase CI/CD:**
   - Connect your GitHub repo to Firebase
   - Enable automatic deployments

## Quick Deploy Command

From project root:

```bash
firebase deploy --only functions
```

That's it! Once deployed, your Netlify site will be able to call the functions without CORS errors.
