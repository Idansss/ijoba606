# Quick Start Guide - IJBoba 606

Get up and running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- A Firebase account (free tier is fine)

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

## Step 2: Firebase Setup (2 min)

### Create Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" → Name it → Create

### Enable Auth
1. Go to **Authentication** → **Sign-in method**
2. Enable **Anonymous**
3. Enable **Google** (add your email)

### Create Database
1. Go to **Firestore Database**
2. Click "Create database" → **Test mode** → Next → Enable

### Get Config
1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" → Click web icon (</>)
3. Copy the config values

## Step 3: Configure Environment (1 min)

```bash
# Copy template
cp .env.local.example .env.local

# Edit .env.local with your Firebase config
```

Add your values to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
NEXT_PUBLIC_LEADERBOARD_ENABLED=true
```

## Step 4: Deploy Firestore Rules (1 min)

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Firestore only for now)
firebase init firestore
# Use existing project
# Press Enter for default file names

# Deploy rules
firebase deploy --only firestore:rules
```

## Step 5: Run the App! (30 sec)

```bash
npm run dev
```

Open http://localhost:3000 🎉

## What Works Right Now

✅ **Home Page** - Beautiful landing page  
✅ **Authentication** - Sign in as guest or with Google  
✅ **Calculator** - Fully functional tax calculator  
✅ **Profile** - View your stats and badges  
✅ **UI/UX** - All pages with animations  

## What Needs Backend

❌ **Quiz Submission** - Frontend works, needs Cloud Function  
❌ **Leaderboard** - Display works, needs data  
❌ **Forum** - Not yet implemented  

## Quick Test Flow

1. Open app → Click "Sign In & Play"
2. Go to Calculator → Enter salary data → Calculate
3. View result → Save to profile (if signed in)
4. Navigate through pages

## Optional: Seed Data

### Add PAYE Rules

Go to Firestore console → Create collection `configs` → Add document `payeRules`:

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
  "notes": "Educational purposes only. Not legal or tax advice."
}
```

### Add Sample Questions

Collection: `questions`  
Document: Auto-ID

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
  "explanation": "PAYE stands for Pay As You Earn.",
  "tags": ["basics"]
}
```

Add at least 3 questions per level (9 total) for testing.

## Run Tests

```bash
npm test
```

## Common Issues

**"Failed to fetch" error:**
- Check your Firebase config in `.env.local`
- Verify Firebase project is active

**Auth not working:**
- Make sure Anonymous + Google providers are enabled
- Check authorized domains in Firebase Console

**Calculator not loading rules:**
- Seed the `configs/payeRules` document in Firestore

## Next Steps

- Read `README.md` for detailed setup
- Check `PROJECT_STATUS.md` for what's built
- See `DEPLOYMENT.md` for production deployment
- Implement Cloud Functions (see `lib/firebase/functions.ts`)

## Support

- Detailed docs in `README.md`
- Architecture in `PROJECT_STATUS.md`
- Deployment guide in `DEPLOYMENT.md`
- Code examples throughout the project

---

**You're ready to go! 🚀**

Start with the calculator (fully functional) and explore the app!


