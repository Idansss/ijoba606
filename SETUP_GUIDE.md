# Setup Guide for ijoba 606

## Step 1: Install Node.js (if not already installed)

### Check if Node.js is installed:
Open PowerShell and run:
```powershell
node --version
npm --version
```

### If Node.js is not installed:
1. Download Node.js from https://nodejs.org/ (LTS version recommended)
2. Run the installer
3. **Important**: Check "Add to PATH" during installation
4. Restart your terminal/PowerShell after installation

### If Node.js is installed but not in PATH:
1. Find where Node.js is installed (common locations):
   - `C:\Program Files\nodejs\`
   - `C:\Program Files (x86)\nodejs\`
   - `%AppData%\npm\`
2. Add it to your PATH:
   - Open System Properties > Environment Variables
   - Add Node.js installation path to PATH variable
   - Restart terminal

## Step 2: Install Project Dependencies

Once Node.js is working, run:
```bash
npm install
```

This will install all required packages listed in `package.json`.

## Step 3: Set Up Firebase

### 3.1 Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Enter project name and follow the setup wizard

### 3.2 Enable Authentication
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Anonymous** authentication
3. Enable **Google** authentication (add your email as authorized domain)

### 3.3 Create Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **Test mode** (you can secure it later)
4. Choose a location (e.g., `nam5` for US)

### 3.4 Get Firebase Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon `</>`
4. Register app (or use existing)
5. Copy the configuration values

## Step 4: Configure Environment Variables

1. Copy the example file:
   ```bash
   copy .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_LEADERBOARD_ENABLED=true
   ```

## Step 5: Install Firebase CLI (Optional but Recommended)

```bash
npm install -g firebase-tools
```

Then login:
```bash
firebase login
```

Initialize Firebase in your project:
```bash
firebase init firestore
```
- Select your Firebase project
- Use default file names (press Enter)

Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

## Step 6: Seed Initial Data (Optional)

### Seed PAYE Rules
Go to Firestore Console > Create collection `configs` > Add document `payeRules`:

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

## Step 7: Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Troubleshooting

### Node.js not found
- Make sure Node.js is installed and in your PATH
- Restart your terminal after installation
- Try using full path: `C:\Program Files\nodejs\node.exe --version`

### npm install fails
- Check your internet connection
- Try clearing npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Firebase connection errors
- Verify all environment variables in `.env.local` are correct
- Check that Firebase project is active
- Ensure Authentication and Firestore are enabled

### Port 3000 already in use
- Change port: `npm run dev -- -p 3001`
- Or stop the process using port 3000

## Next Steps

- Read `README.md` for detailed documentation
- Check `QUICKSTART.md` for quick reference
- See `PROJECT_STATUS.md` for project status

