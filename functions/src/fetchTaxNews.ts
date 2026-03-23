/**
 * Fetches tax-related news from RSS feeds and summarizes with AI.
 * Used by the scheduled fetchTaxNews Cloud Function.
 */

import * as logger from "firebase-functions/logger";

const TAX_KEYWORDS = [
  "tax",
  "paye",
  "firs",
  "vat",
  "revenue",
  "income tax",
  "cac",
  "taxation",
  "budget",
  "fiscal",
  "compliance",
  "penalty",
  "audit",
  "economy",
  "finance",
  "government",
  "naira",
  "inflation",
  "expenditure",
  "tariff",
  "customs",
  "duty",
  "remittance",
  // Nigerian Tax Law 2026 (effective Jan 1, 2026)
  "tax law 2026",
  "finance act 2025",
  "finance act 2026",
  "tax reform 2026",
];

const RSS_FEEDS = [
  { url: "https://nairametrics.com/feed/", name: "Nairametrics" },
  { url: "https://www.premiumtimesng.com/feed/", name: "Premium Times" },
  { url: "https://www.thecable.ng/feed/", name: "TheCable" },
  { url: "https://businessday.ng/feed/", name: "BusinessDay" },
  { url: "https://rss.punchng.com/v1/category/latest_news", name: "Punch" },
  { url: "https://rss.punchng.com/v1/category/business", name: "Punch Business" },
  { url: "https://www.vanguardngr.com/feed/", name: "Vanguard" },
  { url: "https://guardian.ng/feed/", name: "Guardian" },
  { url: "https://www.thisdaylive.com/index.php?feed=rss", name: "ThisDay" },
];

export interface RawFeedItem {
  title: string;
  link: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  isoDate?: string;
}

export interface ProcessedArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  source: string;
  sourceUrl: string;
  category: string;
  publishedAt: Date;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}

function isTaxRelated(title: string, snippet: string): boolean {
  const combined = `${title} ${snippet}`.toLowerCase();
  return TAX_KEYWORDS.some((kw) => combined.includes(kw));
}

async function summarizeWithGemini(
  title: string,
  rawContent: string,
  sourceUrl: string,
  sourceName: string
): Promise<{ excerpt: string; content: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const textToSummarize = rawContent?.slice(0, 4000) || title;
  const prompt = `You are summarizing a Nigerian news article for a tax/PAYE education website.

Original title: ${title}
Source: ${sourceName}
Source URL: ${sourceUrl}

Raw content (may be HTML or plain text):
${textToSummarize}

Return a JSON object with exactly two fields:
1. "excerpt": A 1-2 sentence summary (max 200 chars) suitable for a news listing.
2. "content": HTML content for the full article. Use <p> tags for paragraphs. Include key facts. If the raw content is HTML, clean it and simplify. Make it readable and relevant to Nigerian tax/PAYE context. Max 800 words equivalent.

Return ONLY valid JSON, no markdown or extra text.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";

  // Extract JSON (handle markdown code blocks)
  let jsonStr = text;
  const match = text.match(/\{[\s\S]*\}/);
  if (match) jsonStr = match[0];

  const parsed = JSON.parse(jsonStr) as { excerpt?: string; content?: string };
  return {
    excerpt: parsed.excerpt || title.slice(0, 150),
    content: parsed.content || `<p>${title}</p><p><a href="${sourceUrl}">Read original</a></p>`,
  };
}

async function summarizeWithOpenAI(
  title: string,
  rawContent: string,
  sourceUrl: string,
  sourceName: string
): Promise<{ excerpt: string; content: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const textToSummarize = rawContent?.slice(0, 4000) || title;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You summarize Nigerian news for a tax education site. Return only valid JSON with 'excerpt' and 'content' keys.",
        },
        {
          role: "user",
          content: `Summarize this article for our tax news page.

Title: ${title}
Source: ${sourceName}
URL: ${sourceUrl}

Raw content:
${textToSummarize}

Return JSON: { "excerpt": "1-2 sentence summary, max 200 chars", "content": "HTML paragraphs, cleaned and relevant, max 800 words" }`,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "{}";
  const match = text.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : text;
  const parsed = JSON.parse(jsonStr) as { excerpt?: string; content?: string };

  return {
    excerpt: parsed.excerpt || title.slice(0, 150),
    content:
      parsed.content ||
      `<p>${title}</p><p><a href="${sourceUrl}">Read original</a></p>`,
  };
}

async function summarize(
  title: string,
  rawContent: string,
  sourceUrl: string,
  sourceName: string
): Promise<{ excerpt: string; content: string }> {
  if (process.env.GEMINI_API_KEY) {
    return summarizeWithGemini(title, rawContent, sourceUrl, sourceName);
  }
  if (process.env.OPENAI_API_KEY) {
    return summarizeWithOpenAI(title, rawContent, sourceUrl, sourceName);
  }
  throw new Error("Set GEMINI_API_KEY or OPENAI_API_KEY for AI summarization");
}

export async function fetchAndProcessTaxNews(
  maxArticles: number = 5
): Promise<ProcessedArticle[]> {
  const Parser = (await import("rss-parser")).default;
  const parser = new Parser({ timeout: 10000 });

  const taxItems: { item: RawFeedItem; source: string }[] = [];
  const allItems: { item: RawFeedItem; source: string }[] = [];
  const businessFeeds = ["Nairametrics", "BusinessDay", "Punch Business"];

  for (const feed of RSS_FEEDS) {
    try {
      const result = await parser.parseURL(feed.url);
      const items = (result.items || []) as RawFeedItem[];
      for (const item of items) {
        const snippet = item.contentSnippet || item.content || "";
        const entry = { item, source: feed.name };
        allItems.push(entry);
        if (isTaxRelated(item.title || "", snippet)) {
          taxItems.push(entry);
        }
      }
    } catch (err) {
      logger.warn(`Failed to fetch RSS ${feed.url}`, err);
    }
  }

  const sortByDate = (a: { item: RawFeedItem }, b: { item: RawFeedItem }) => {
    const dateA = a.item.isoDate || a.item.pubDate || "";
    const dateB = b.item.isoDate || b.item.pubDate || "";
    return dateB.localeCompare(dateA);
  };
  taxItems.sort(sortByDate);
  allItems.sort(sortByDate);

  // Prefer tax-related; if none, use top items from business feeds
  let toProcess = taxItems.slice(0, maxArticles);
  if (toProcess.length === 0) {
    logger.info("No tax-filtered articles; using fallback from business feeds");
    const fallback = allItems.filter((x) => businessFeeds.includes(x.source));
    toProcess = fallback.slice(0, Math.min(maxArticles, 5));
  }

  const processed: ProcessedArticle[] = [];

  for (const { item, source } of toProcess) {
    try {
      const rawContent = item.content || item.contentSnippet || item.title || "";
      const { excerpt, content } = await summarize(
        item.title || "Untitled",
        rawContent,
        item.link || "",
        source
      );

      const pubDate = item.isoDate || item.pubDate;
      const publishedAt = pubDate ? new Date(pubDate) : new Date();

      processed.push({
        title: item.title || "Untitled",
        slug: slugify(item.title || `article-${Date.now()}`),
        excerpt,
        content,
        source,
        sourceUrl: item.link || "",
        category: "Tax & Compliance",
        publishedAt,
      });
    } catch (err) {
      logger.warn("Failed to process article", { title: item.title, err });
    }
  }

  return processed;
}

/**
 * Fetch tax/business news from RSS feeds WITHOUT AI summarization.
 * No GEMINI_API_KEY or OPENAI_API_KEY needed. Uses raw title + snippet.
 */
export async function fetchTaxNewsRssOnly(
  maxArticles: number = 15
): Promise<ProcessedArticle[]> {
  const Parser = (await import("rss-parser")).default;
  const parser = new Parser({ timeout: 10000 });

  const taxItems: { item: RawFeedItem; source: string }[] = [];
  const allItems: { item: RawFeedItem; source: string }[] = [];
  const businessFeeds = ["Nairametrics", "BusinessDay", "Punch Business"];

  for (const feed of RSS_FEEDS) {
    try {
      const result = await parser.parseURL(feed.url);
      const items = (result.items || []) as RawFeedItem[];
      for (const item of items) {
        const snippet = item.contentSnippet || item.content || "";
        const entry = { item, source: feed.name };
        allItems.push(entry);
        if (isTaxRelated(item.title || "", snippet)) {
          taxItems.push(entry);
        }
      }
    } catch (err) {
      logger.warn(`Failed to fetch RSS ${feed.url}`, err);
    }
  }

  const sortByDate = (a: { item: RawFeedItem }, b: { item: RawFeedItem }) => {
    const dateA = a.item.isoDate || a.item.pubDate || "";
    const dateB = b.item.isoDate || b.item.pubDate || "";
    return dateB.localeCompare(dateA);
  };
  taxItems.sort(sortByDate);
  allItems.sort(sortByDate);

  let toProcess = taxItems.slice(0, maxArticles);
  if (toProcess.length === 0) {
    logger.info("No tax-filtered articles; using fallback from business feeds");
    const fallback = allItems.filter((x) => businessFeeds.includes(x.source));
    toProcess = fallback.slice(0, Math.min(maxArticles, 10));
  }

  const processed: ProcessedArticle[] = [];
  for (const { item, source } of toProcess) {
    const rawContent = item.content || item.contentSnippet || item.title || "";
    const excerpt = (rawContent?.slice(0, 200) || item.title || "Untitled").trim();
    const pubDate = item.isoDate || item.pubDate;
    const publishedAt = pubDate ? new Date(pubDate) : new Date();

    processed.push({
      title: item.title || "Untitled",
      slug: slugify(item.title || `article-${Date.now()}`),
      excerpt: excerpt.length > 200 ? excerpt.slice(0, 197) + "…" : excerpt,
      content: `<p>${excerpt}</p><p><a href="${item.link || "#"}">Read original on ${source}</a></p>`,
      source,
      sourceUrl: item.link || "",
      category: "Tax & Compliance",
      publishedAt,
    });
  }

  logger.info("RSS-only fetch completed", { count: processed.length });
  return processed;
}

const SEARCH_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
] as const;

/**
 * Search the web via Gemini Google Search grounding for Nigerian Tax Law 2026 and related content.
 * Returns articles found from web search (not limited to RSS feeds).
 */
export async function searchWebForTaxLaw2026(
  maxArticles: number = 5
): Promise<ProcessedArticle[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const prompt = `Search the web for recent news and articles about:
1. Nigerian Tax Law 2026 (effective January 1, 2026)
2. Finance Act 2025 or 2026 Nigeria
3. PAYE changes 2026 Nigeria
4. Nigerian tax reforms 2026
5. FIRS tax updates 2026

Find articles from trusted Nigerian sources (Punch, Vanguard, Guardian, ThisDay, BusinessDay, Nairametrics, Premium Times, TheCable, etc.).

Return a JSON array of exactly ${maxArticles} articles (or fewer if not enough found). Each article must have:
- "title": string
- "excerpt": 1-2 sentence summary (max 200 chars)
- "content": HTML content with <p> tags, key facts from the article (max 500 words)
- "source": publication name
- "sourceUrl": the article URL
- "publishedAt": ISO date string if known, or "2026-01-01"

Return ONLY the JSON array, no other text. Example format:
[{"title":"...","excerpt":"...","content":"<p>...</p>","source":"Punch","sourceUrl":"https://...","publishedAt":"2026-01-15"}]`;

  let lastError: Error | null = null;
  for (const model of SEARCH_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        lastError = new Error(`Gemini ${model}: ${response.status} ${err.slice(0, 300)}`);
        logger.warn("Gemini search model failed, trying next", { model, status: response.status });
        continue;
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";

      let jsonStr = text;
      const match = text.match(/\[[\s\S]*\]/);
      if (match) jsonStr = match[0];

      const parsed = JSON.parse(jsonStr) as Array<{
        title?: string;
        excerpt?: string;
        content?: string;
        source?: string;
        sourceUrl?: string;
        publishedAt?: string;
      }>;

      const processed: ProcessedArticle[] = [];
      for (const p of parsed) {
        if (!p.title || !p.sourceUrl) continue;
        processed.push({
          title: p.title,
          slug: slugify(p.title),
          excerpt: p.excerpt || p.title.slice(0, 150),
          content: p.content || `<p>${p.title}</p><p><a href="${p.sourceUrl}">Read original</a></p>`,
          source: p.source || "Web",
          sourceUrl: p.sourceUrl,
          category: "Tax Law 2026",
          publishedAt: p.publishedAt ? new Date(p.publishedAt) : new Date(),
        });
      }
      logger.info("Tax Law 2026 search succeeded", { model, count: processed.length });
      return processed;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn("Gemini search failed, trying next model", { model, err: String(lastError) });
    }
  }

  throw lastError ?? new Error("All Gemini models failed for web search");
}
