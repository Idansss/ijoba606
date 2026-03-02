# Tax News Auto-Fetch — Setup Guide

The news section can automatically fetch and summarize tax-related articles from Nigerian sources using AI.

---

## Quick Start (3 steps)

### Step 1: Get an API key

Choose **one** of these (Gemini is free and recommended):

| Provider | Get key | Cost |
|----------|---------|------|
| **Gemini** (recommended) | [Google AI Studio](https://aistudio.google.com/apikey) | Free tier |
| **OpenAI** | [OpenAI API keys](https://platform.openai.com/api-keys) | Pay per use |

### Step 2: Add the key to Firebase

```bash
# If using Gemini (recommended):
firebase functions:secrets:set GEMINI_API_KEY
# Paste your key when prompted

# OR if using OpenAI:
firebase functions:secrets:set OPENAI_API_KEY
# Paste your key when prompted
```

### Step 3: Deploy functions

```bash
firebase deploy --only functions
```

---

## How it works

| Feature | Description |
|---------|-------------|
| **Fetch from AI** | One-click button in Admin → News. Fetches up to 5 new articles immediately. |
| **Scheduled job** | Runs once daily (midnight Lagos time) to fetch new articles automatically. |
| **Sources** | Nairametrics, Premium Times, TheCable, BusinessDay |
| **Filter** | Only tax-related articles (tax, PAYE, FIRS, VAT, revenue, etc.) |
| **AI** | Summarizes each article for your news page |

---

## Troubleshooting

**"Set GEMINI_API_KEY or OPENAI_API_KEY"**
- Run `firebase functions:secrets:set GEMINI_API_KEY` and paste your key
- Redeploy: `firebase deploy --only functions`

**"Admin only"**
- Only users with `role: 'admin'` in Firestore can use Fetch from AI

**No articles added**
- Feeds may have no tax-related items at that moment
- Try again later or add articles manually
