# Cursor AI Integration Setup Guide

## Overview

Cursor AI has been integrated into the question generation system. However, **important note**: Cursor is primarily a code editor tool, and their API may not be designed for general question generation. This implementation assumes an OpenAI-compatible API structure.

## Setup Instructions

### Step 1: Get Cursor API Key

1. **Sign up/Login to Cursor:**
   - Go to [Cursor Dashboard](https://cursor.com)
   - Navigate to **Settings** → **API Keys** or **Integrations**
   - Generate a new API key

2. **Note the API Details:**
   - API Base URL: `https://api.cursor.com`
   - Endpoint: `/v1/chat/completions` (if OpenAI-compatible)
   - Model name: Check Cursor's documentation for available models

### Step 2: Set API Key as Secret

**Option A: Using Firebase CLI (Recommended)**

```bash
# Set the Cursor API key
echo "your-cursor-api-key-here" | firebase functions:secrets:set CURSOR_API_KEY

# Optionally set custom API URL if different
echo "https://api.cursor.com/v1/chat/completions" | firebase functions:secrets:set CURSOR_API_URL

# Optionally set model name
echo "gpt-4" | firebase functions:secrets:set CURSOR_MODEL
```

**Option B: Using Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `ijoba606-778a1`
3. Navigate to **Functions** → **Configuration**
4. Add environment variables:
   - `CURSOR_API_KEY` = `your-api-key`
   - `CURSOR_API_URL` = `https://api.cursor.com/v1/chat/completions` (optional)
   - `CURSOR_MODEL` = `gpt-4` (optional, update based on available models)

### Step 3: Verify API Endpoint Structure

**Important**: Cursor's API may not follow OpenAI's structure exactly. You may need to:

1. **Check Cursor's API Documentation:**
   - Visit: https://docs.cursor.com
   - Look for API reference or integration guides
   - Verify the endpoint structure and request format

2. **Update if Needed:**
   - If Cursor uses a different endpoint structure, update `functions/src/generateQuestion.ts`
   - Modify the `generateQuestionsWithCursor` function to match Cursor's API format

### Step 4: Test the Integration

1. **Deploy the Function:**
   ```bash
   firebase deploy --only functions:generateQuestions
   ```

2. **Test in Admin Panel:**
   - Go to `/admin/questions`
   - Click "🤖 Generate with AI"
   - Select "Cursor AI" as provider
   - Generate a test question

3. **Check Logs:**
   - Go to Firebase Console → Functions → Logs
   - Look for any errors or warnings
   - Verify the API call is successful

## Troubleshooting

### Error: "CURSOR_API_KEY is not set"
- Make sure you've set the secret using `firebase functions:secrets:set CURSOR_API_KEY`
- Redeploy the function after setting the secret

### Error: "Cursor API error: 404"
- The endpoint URL might be incorrect
- Check Cursor's documentation for the correct endpoint
- Update `CURSOR_API_URL` environment variable

### Error: "Invalid model"
- The model name might not be available in Cursor
- Check Cursor's documentation for available models
- Update `CURSOR_MODEL` environment variable

### API Structure Mismatch
- Cursor's API might use a different request/response format
- You'll need to modify `generateQuestionsWithCursor` in `functions/src/generateQuestion.ts`
- Match the exact structure expected by Cursor's API

## Alternative: Use Anthropic Claude

If Cursor's API doesn't work well for question generation, consider using **Anthropic's Claude API** instead:

1. **Get Claude API Key:**
   - Sign up at https://console.anthropic.com
   - Generate an API key

2. **Update the Code:**
   - Add Claude as a provider (similar to how Cursor was added)
   - Use Claude's API endpoint: `https://api.anthropic.com/v1/messages`

3. **Claude is better suited** for general question generation than Cursor

## Current Implementation

The current implementation assumes:
- **Endpoint**: `https://api.cursor.com/v1/chat/completions`
- **Format**: OpenAI-compatible API structure
- **Model**: `gpt-4` (configurable via `CURSOR_MODEL` env var)
- **Authentication**: Bearer token in Authorization header

**If Cursor's API differs**, you'll need to update the `generateQuestionsWithCursor` function accordingly.

## Next Steps

1. ✅ Get Cursor API key
2. ✅ Set it as a Firebase secret
3. ⚠️ **Verify API endpoint structure** (may need updates)
4. ✅ Deploy and test
5. 🔄 Update code if API structure differs

---

**Note**: If you encounter issues, Cursor's API might not be designed for this use case. Consider using Claude API or another AI provider that's better suited for question generation.
