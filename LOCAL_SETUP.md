# Quick Setup - Your Local Machine

## ✅ What's Already Done

1. ✅ **Dependencies Installed** - All npm packages are installed
2. ✅ **Environment Template Created** - `.env.local.example` is ready

## ⚠️ Important: Node.js PATH Issue

Node.js is installed but not in your system PATH. You have two options:

### Option 1: Add Node.js to PATH (Recommended - Permanent Fix)

1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find and select "Path", then click "Edit"
5. Click "New" and add: `C:\Program Files\nodejs`
6. Click OK on all dialogs
7. **Restart your terminal/PowerShell**

After this, you can use `node` and `npm` directly.

### Option 2: Use Full Path (Quick Fix)

For now, you can use the full path in PowerShell:
```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
```

Then run your commands normally.

## 📋 Next Steps

### Step 1: Set Up Firebase Configuration

1. **Copy the environment template:**
   ```powershell
   copy .env.local.example .env.local
   ```

2. **Get your Firebase config:**
   - Go to https://console.firebase.google.com
   - Select your project (or create a new one)
   - Go to Project Settings (gear icon) > Your apps
   - Click the web icon `</>`
   - Copy the config values

3. **Edit `.env.local`** and replace the placeholder values with your actual Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_LEADERBOARD_ENABLED=true
   ```

### Step 2: Enable Firebase Services

In Firebase Console:

1. **Authentication:**
   - Go to Authentication > Sign-in method
   - Enable **Anonymous**
   - Enable **Google** (add your email)

2. **Firestore Database:**
   - Go to Firestore Database
   - Click "Create database" (if not created)
   - Start in **Test mode**
   - Choose location (e.g., `nam5`)

### Step 3: Run the Development Server

**If you fixed PATH (Option 1):**
```powershell
npm run dev
```

**If using full path (Option 2):**
```powershell
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm run dev
```

Then open http://localhost:3000 in your browser.

## 🎯 Quick Test

Once the server is running:
1. Open http://localhost:3000
2. Try the calculator (works without backend)
3. Sign in as guest or with Google
4. Explore the app!

## 📚 More Help

- See `QUICKSTART.md` for detailed setup
- See `README.md` for full documentation
- See `SETUP_GUIDE.md` for troubleshooting

