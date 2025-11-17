# Deployment Guide for IJBoba 606

This guide covers deploying IJBoba 606 to production.

## Prerequisites

- [x] Firebase project created
- [x] Node.js 18+ installed
- [x] Git repository initialized
- [x] Code pushed to GitHub/GitLab
- [x] Firebase CLI installed: `npm install -g firebase-tools`

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it (e.g., "ijoba606")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication

1. Go to **Authentication** > **Sign-in method**
2. Enable **Anonymous** provider
3. Enable **Google** provider:
   - Enter support email
   - Save

### 1.3 Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose location (e.g., `eur3` for Europe or `us-central` for US)
4. Start in **test mode** (we'll deploy rules later)

### 1.4 Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click web icon (</>)
4. Register app (name: "IJBoba 606 Web")
5. Copy the config object

## Step 2: Environment Configuration

Create `.env.local` (for development) and prepare for production:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc...
NEXT_PUBLIC_LEADERBOARD_ENABLED=true
```

## Step 3: Deploy Firestore Rules

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting (optional)

# Deploy rules
firebase deploy --only firestore:rules
```

Verify rules are deployed by checking Firestore > Rules in console.

## Step 4: Seed Initial Data

### 4.1 Seed PAYE Rules

Go to Firestore console and manually create:

**Collection:** `configs`  
**Document ID:** `payeRules`  
**Fields:**

```json
{
  "currency": "NGN",
  "year": 2025,
  "reliefs": {
    "pensionIsDeductible": true,
    "nhfIsDeductible": true
  },
  "brackets": [
    { "upTo": 300000, "rate": 0.07 },
    { "upTo": 600000, "rate": 0.11 },
    { "upTo": 1100000, "rate": 0.15 },
    { "upTo": 1600000, "rate": 0.19 },
    { "upTo": 3200000, "rate": 0.21 },
    { "upTo": 9999999999, "rate": 0.24 }
  ],
  "personalAllowance": {
    "type": "hybrid",
    "value": 200000
  },
  "notes": "Educational purposes only. Not legal or tax advice. Based on Nigeria PAYE 2025 estimates. Consult a tax professional for your specific situation."
}
```

### 4.2 Seed Sample Questions

Create documents in `questions` collection:

**Document ID:** Auto-generate  
**Fields (example):**

```json
{
  "level": 1,
  "type": "single",
  "prompt": "What does PAYE stand for?",
  "options": [
    "Pay As You Earn",
    "Pay After You Earn",
    "Pay All Your Earnings",
    "Pay Annual Year End"
  ],
  "correct": [0],
  "explanation": "PAYE stands for Pay As You Earn, a system where income tax is deducted from your salary before you receive it.",
  "tags": ["basics"]
}
```

Create at least 9 questions (3 per level) for testing.

## Step 5: Cloud Functions Setup

**Note:** Cloud Functions need to be implemented. Here's the structure:

### 5.1 Initialize Functions

```bash
cd functions
npm install
```

### 5.2 Required Functions

Create these in `functions/src/index.ts`:

- `submitRound` - Process quiz submissions
- `createThread` - Forum thread creation
- `createPost` - Forum post creation  
- `voteThread` / `votePost` - Voting
- `saveCalcRun` - Save calculator results
- `adminSetPayeRules` - Admin update rules
- `rollWeeklyLeaderboards` - Scheduled (Mondays 00:05 Africa/Lagos)

### 5.3 Deploy Functions

```bash
firebase deploy --only functions
```

## Step 6: Deploy to Vercel (Recommended)

### 6.1 Connect to GitHub

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository

### 6.2 Configure Project

**Framework Preset:** Next.js  
**Root Directory:** `./` (default)  
**Build Command:** `npm run build` (default)  
**Output Directory:** `.next` (default)

### 6.3 Add Environment Variables

In Vercel project settings > Environment Variables, add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_LEADERBOARD_ENABLED=true
```

### 6.4 Deploy

Click "Deploy"

Your app will be live at: `https://your-project.vercel.app`

### 6.5 Add Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your domain
3. Follow DNS configuration instructions

## Step 7: Firebase Hosting (Alternative)

If using Firebase Hosting instead of Vercel:

### 7.1 Build for Production

```bash
npm run build
```

### 7.2 Configure firebase.json

```json
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 7.3 Export Static Site

Add to `package.json`:

```json
{
  "scripts": {
    "export": "next build && next export"
  }
}
```

Run:
```bash
npm run export
```

### 7.4 Deploy

```bash
firebase deploy --only hosting
```

## Step 8: Post-Deployment Checklist

- [ ] Test authentication (Anonymous + Google)
- [ ] Test quiz flow (play round, submit, see results)
- [ ] Test calculator (input data, see results)
- [ ] Check leaderboard updates
- [ ] Verify Firestore rules are working
- [ ] Test on mobile devices
- [ ] Check privacy and terms pages
- [ ] Set up monitoring/analytics
- [ ] Configure Firebase App Check (recommended)
- [ ] Set up error tracking (Sentry, etc.)

## Step 9: Create First Admin User

1. Sign in to the app
2. Go to Firestore console
3. Find your user in `users` collection
4. Edit document
5. Change `role` field from `"user"` to `"admin"`
6. Reload app - you now have admin access

## Step 10: Monitoring & Maintenance

### Firebase Console
- Monitor Authentication usage
- Check Firestore usage and costs
- Review Cloud Functions logs and invocations

### Vercel Dashboard
- Check deployment status
- Monitor bandwidth and function execution
- Review error logs

### Regular Maintenance
- Update dependencies: `npm update`
- Review and update PAYE rules annually
- Add new quiz questions regularly
- Moderate forum content
- Back up Firestore data

## Security Considerations

1. **Enable App Check** (recommended):
   ```bash
   firebase init appcheck
   ```

2. **Review Firestore Rules** regularly

3. **Rate limit** API calls in Cloud Functions

4. **Monitor costs** (Firebase free tier limits)

5. **Backup strategy**:
   ```bash
   # Export Firestore
   gcloud firestore export gs://[BUCKET_NAME]
   ```

## Troubleshooting

### "Failed to fetch" errors
- Check Firebase config in `.env.local`
- Verify Firebase project is active
- Check Firestore rules allow read/write

### Authentication not working
- Verify providers are enabled in Firebase Console
- Check authorized domains (Settings > Authorized domains)
- Ensure redirect URLs are correct

### Functions timing out
- Increase timeout in `firebase.json`
- Optimize function code
- Check for infinite loops

### Build failures
- Clear Next.js cache: `rm -rf .next`
- Update dependencies
- Check for TypeScript errors: `npm run build`

## Cost Estimation

**Firebase Free Tier (Spark Plan):**
- Firestore: 50k reads, 20k writes, 20k deletes per day
- Functions: 2M invocations per month
- Auth: Unlimited

**Vercel Free Tier:**
- 100 GB bandwidth
- Unlimited websites
- Automatic SSL

Most small-to-medium projects stay within free tiers.

## Support

- Firebase Docs: https://firebase.google.com/docs
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs
- Project Issues: GitHub repository

---

**Last Updated:** January 2025


