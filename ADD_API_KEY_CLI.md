# Add API Keys via Terminal/CLI

## Method 1: Using Firebase CLI (Recommended)

### Step 1: Set the OpenAI API Key

Run this command in your terminal (from the project root):

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

When prompted, paste your API key:
```
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
```

### Step 2: Set Gemini API Key (Optional)

If you have a Gemini key:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

### Step 3: Redeploy the Function

After setting secrets, you need to redeploy:

```bash
firebase deploy --only functions:generateQuestions
```

## Method 2: Using Firebase Console (Visual Guide)

If the CLI method doesn't work, here's exactly where to click:

1. **You're currently on:** Functions Dashboard (you can see all your functions listed)

2. **Click on the function name:** Click on `generateQuestions` in the table

3. **Go to Configuration tab:** At the top of the function details page, click the **"Configuration"** tab

4. **Add Environment Variable:**
   - Scroll down to "Environment variables" section
   - Click **"Add variable"** or **"Edit"** button
   - Name: `OPENAI_API_KEY`
   - Value: `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`
   - Click **Save**

5. **Redeploy:** The function will automatically redeploy, or you can manually redeploy:
   ```bash
   firebase deploy --only functions:generateQuestions
   ```

## Method 3: Direct URL to Configuration

Try this direct link (replace with your project if needed):
https://console.firebase.google.com/project/ijoba606-778a1/functions/config

## Troubleshooting

**If `firebase functions:secrets:set` gives a quota error:**
- Wait a few minutes and try again
- Or use Method 2 (Console) instead

**If you can't find Configuration tab:**
- Make sure you clicked on the function name first (not just viewing the list)
- The Configuration tab appears after clicking into a specific function

**To verify the key is set:**
```bash
firebase functions:secrets:access OPENAI_API_KEY
```

This will show you the key (if set via secrets method).
