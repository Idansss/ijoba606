# How to Add AI API Keys to Firebase Functions

## Quick Setup Guide

### Method 1: Firebase Console (Easiest)

1. **Go to Firebase Console:**
   - Visit https://console.firebase.google.com
   - Select your project: `ijoba606-778a1`

2. **Navigate to Functions Configuration:**
   - Click **Functions** in the left sidebar
   - Click **Configuration** tab (at the top)
   - Or go directly: https://console.firebase.google.com/project/ijoba606-778a1/functions/config

3. **Add Environment Variables:**
   - Click **"Add variable"** or **"Edit"** button
   - Add these variables:
     - **Name:** `OPENAI_API_KEY`
     - **Value:** `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`
     - Click **Save** (or **Add**)
   
   - Add Gemini key (if you have one):
     - **Name:** `GEMINI_API_KEY`
     - **Value:** `your-gemini-api-key-here`
     - Click **Save**

4. **Redeploy Functions:**
   ```bash
   firebase deploy --only functions:generateQuestions
   ```

### Method 2: Using Firebase CLI (Alternative)

For Firebase Functions v2, you can also set environment variables via CLI:

```bash
# Set OpenAI key
firebase functions:config:set openai.api_key="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"

# Set Gemini key (if you have one)
firebase functions:config:set gemini.api_key="your-gemini-key"

# Deploy
firebase deploy --only functions
```

**Note:** For v2 functions, the environment variables are accessed via `process.env.VARIABLE_NAME` directly, not via `functions.config()`.

## Getting a Gemini API Key

1. **Go to Google AI Studio:**
   - Visit https://aistudio.google.com/app/apikey

2. **Create API Key:**
   - Click "Create API Key"
   - Select your Google Cloud project (or create one)
   - Copy the API key

3. **Add to Firebase:**
   - Follow Method 1 above
   - Add as `GEMINI_API_KEY`

## Verify Setup

1. **Check Environment Variables:**
   - Go to Firebase Console → Functions → Configuration
   - You should see both `OPENAI_API_KEY` and `GEMINI_API_KEY` listed

2. **Test the Function:**
   - Go to `/admin/questions` (as admin)
   - Click "🤖 Generate with AI"
   - Select provider (OpenAI or Gemini)
   - Generate a question
   - Check if it works!

## Troubleshooting

**"OPENAI_API_KEY environment variable is not set"**
- Make sure you added it in Firebase Console → Functions → Configuration
- Redeploy the function after adding: `firebase deploy --only functions:generateQuestions`

**"GEMINI_API_KEY environment variable is not set"**
- Add it in Firebase Console → Functions → Configuration
- Or use OpenAI instead (it's already set up)

**Function still not working:**
- Check Firebase Console → Functions → Logs for error messages
- Make sure the API key is correct and has credits/quota

## Cost Comparison

- **OpenAI GPT-4o-mini:** ~$0.01-0.05 per 5 questions
- **Google Gemini 1.5 Flash:** Free tier available, then ~$0.075 per 1M input tokens
- **Template-based:** Free (but limited variety)

## Security Note

⚠️ **Important:** Your API keys are sensitive. They're stored securely in Firebase and only accessible to your Cloud Functions. Never commit them to git or expose them in client-side code.
