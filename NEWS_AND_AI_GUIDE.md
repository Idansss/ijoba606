# News/Blog & AI Auto-Fetch Guide

## News Page

The `/news` page displays articles from the Firestore collection `newsArticles`.

### Adding Articles Manually (Admin)

1. Go to Firebase Console → Firestore
2. Create collection `newsArticles` (if it doesn't exist)
3. Add a document with fields:
   - `title` (string)
   - `slug` (string, URL-friendly, e.g. `firs-tax-update-2025`)
   - `excerpt` (string, short summary)
   - `content` (string, HTML content)
   - `source` (optional, e.g. "FIRS")
   - `sourceUrl` (optional, link to original)
   - `category` (optional, e.g. "PAYE", "Compliance")
   - `publishedAt` (Timestamp)
   - `createdAt` (Timestamp)
   - `imageUrl` (optional)

### Auto-Fetch with AI (Cloud Function)

To automatically fetch and publish tax news, you can add a scheduled Cloud Function:

1. **RSS/API sources**: FIRS, Nairametrics, Punch, etc. often have tax news
2. **Scheduled function**: Run daily (e.g. `onSchedule` every 6 hours)
3. **AI summarization**: Use your existing OpenAI/Gemini integration to:
   - Fetch raw content from RSS or a news API
   - Summarize and format for your audience
   - Write to `newsArticles` with `content`, `excerpt`, `title`, etc.

Example structure for a `fetchTaxNews` scheduled function:

```typescript
// In functions/src/index.ts
export const fetchTaxNews = onSchedule(
  { schedule: "every 6 hours", timeZone: "Africa/Lagos", region },
  async () => {
    // 1. Fetch from RSS (e.g. https://nairametrics.com/feed/)
    // 2. For each new item, call OpenAI/Gemini to summarize
    // 3. Add to newsArticles if not duplicate
  }
);
```

You'll need to add an RSS parser (e.g. `rss-parser`) and wire your AI keys.
