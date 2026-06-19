# IJOBA 606 — Full Design Brief for Google Stitch

> Paste any section below into Google Stitch. Start with the **Master Prompt**, then
> feed screens one at a time for best results. Everything here reflects the real,
> shipped product (Next.js 16 + React 19 + Tailwind v4 + Firebase).

---

## 1. MASTER PROMPT (paste this first)

Design a modern, trustworthy **fintech + edutainment web app** for Nigeria called
**IJOBA 606**. It makes personal income tax (PAYE) literacy engaging through four
pillars: (1) a gamified quiz, (2) a PAYE/income-tax calculator, (3) a community
forum, and (4) a marketplace of verified tax consultants with chat, invoicing,
payments and wallets. It also has a tax news feed and a glossary.

Audience: everyday Nigerian salary earners, freelancers, and small-business owners
(mobile-first, many on mid-range Android). Tone: warm, clear, confidence-building,
lightly playful — not corporate-stiff, not childish. It occasionally uses friendly
Nigerian English ("Figure your tax wahala in 60 seconds").

**Design direction — make it feel premium and clean:**
- **Brand color: deep Nigerian green** (`#006400` primary, `#0B7A3B` secondary) with
  a **gold accent** (`#C59F00`). Green = money + national identity + trust.
- Light theme on a soft warm off-white/cream canvas (`#F5F5E8`); full dark mode on
  deep forest green (`#101C10`) with warm off-white text and soft-gold accents.
- Style: **modern fintech minimalism with a bento-grid feel** — generous whitespace,
  large rounded corners (16–32px), soft layered shadows, subtle glassmorphism on
  cards, crisp data/number typography (monospace for figures).
- Replace the current generic purple→blue gradients with a cohesive **green→gold**
  brand system. Keep motion subtle (fade/slide-in on load, gentle hover lift).
- Typography: clean geometric sans (Geist Sans) for UI, monospace (Geist Mono) for
  money amounts and calculator output.
- Accessibility: WCAG AA contrast, large tap targets, clear focus states.

Deliver a consistent component system: sticky top nav, pill-shaped buttons, rounded
cards, status chips/badges, stat tiles, empty states, toasts, and a footer.

---

## 2. PRODUCT MAP (every route)

**Public / core**
- `/` Home (hero + 4 pillar cards + progress stats + disclaimer)
- `/play` Quiz lobby (level select, streak, badges)
- `/round` Active quiz round (3 questions)
- `/results` & `/calculator/result` Results / breakdown
- `/calculator` PAYE & income-tax calculator
- `/leaderboard` Ranked players
- `/glossary` Tax term glossary
- `/news` + `/news/[slug]` Tax news feed & article
- `/contact` Contact form
- `/legal/privacy`, `/legal/terms`

**Forum**
- `/forum` Thread list (tabs: New / Trending / Unanswered, search, tags, sidebar)
- `/forum/new` Compose thread (markdown editor)
- `/forum/thread/[id]` Thread + replies + voting
- `/forum/tag/[tag]` Threads by tag
- `/forum/me` My forum activity

**Consultant marketplace**
- `/consultants` Landing (how-it-works, FAQ)
- `/consultants/browse` Browse/search consultant cards
- `/consultants/[consultantId]` Consultant profile
- `/consultants/apply` Apply to become a consultant
- `/consultants/request` Request help form
- `/consultants/chat/[consultantId]` Chat thread
- `/consultants/profile` Consultant's own editable profile
- `/consultants/invoices/create`, `/consultants/invoices/[invoiceId]`,
  `/consultants/invoices/[invoiceId]/complete`
- `/consultants/wallet` Earnings wallet
- `/consultants/bank-account`, `/consultants/thanks`

**User account**
- `/profile` Profile & stats + notifications
- `/dashboard` Customer dashboard (invoices/services)
- `/dashboard/invoices/[invoiceId]/confirm`, `/refund`
- `/settings/bank-account`

**Admin** (`/admin`, `/admin/login`, `/admin/register`)
- `/admin/consultants`, `/admin/news`, `/admin/questions`, `/admin/rules`,
  `/admin/transactions`, `/admin/mod` (moderation), breadcrumb nav.

---

## 3. GLOBAL UI (every page)

**Header (sticky, top, blurred):**
- Left: logo mark (rounded square, sparkle icon) + wordmark "IJOBA 606" with kicker
  "Learn · Play · Calculate".
- Center: pill nav with icons — Learn & Play, Forum, Calculator, Leaderboard,
  Glossary, Consultants, News, Contact. Active item = filled green→gold pill.
- Right: theme toggle (light/dark), then either **Try Demo / Sign in** buttons, or
  (signed in) a **bell with unread badge** + **avatar menu** (initials avatar,
  points shown). Avatar dropdown: Profile & Stats, Forum Activity, My Dashboard,
  Admin Panel (admins only), Sign out.
- Mobile: hamburger → full-screen slide-down menu.

**Footer:** brand blurb "Make PAYE literacy hard to ignore." + Start a round /
Estimate PAYE buttons; columns Product, Community, Legal; copyright +
"Educational purposes only — not legal or tax advice."

**System:** toast notifications (success/error/info), loading spinners,
empty-state cards, repeated **educational-disclaimer** chips.

---

## 4. SCREEN-BY-SCREEN

### Home `/`
Centered hero: huge gradient wordmark "IJOBA 606", tagline
"Learn PAYE • Play Quizzes • Join Forum • Calculate Tax", subtext with 🇳🇬.
Below: **4 pillar cards** in a responsive grid, each with icon, title, description,
and an arrow CTA:
1. 🎓 Learn & Play → quiz (badges, streaks, leaderboard)
2. 🧮 Tax Calculator → "Figure your tax in 60 seconds" (educational only)
3. 💬 Community Forum → ask & share
4. 💼 Talk to a Consultant → verified experts
If signed in: a **"Your Progress"** stat panel — Total Points, Current Streak,
Best Streak, Badges Earned. Privacy + educational disclaimer at bottom.
*Redesign note:* convert the 4 cards into a polished **bento grid** with the green/gold
system, distinct accent per card, iconography instead of emoji optional.

### Quiz lobby `/play`
Logged-out: centered card "3 questions per round, rewards that stick" + Try demo round.
Logged-in: "Round builder" panel — streak pill, badge shelf, last round score
(x/30), **3 level cards** (locked/unlocked/selected states), big "Start round" CTA.
Scoring: +10 correct, +2 for attempting. Levels unlock by performance.

### Active round `/round`
One of 3 questions at a time: progress indicator, prompt, 4 option cards
(single or multi-select), score meter, streak pill; per-question feedback +
explanation; end-of-round summary with share sheet.

### Calculator `/calculator`
Title "Personal Income Tax Calculator", 🧮, yellow educational-disclaimer chip.
Form card (`CalcForm`): toggle **salary vs non-salary**, **monthly vs annual**;
salary inputs (basic, housing, transport, other, bonus, pension %, NHF, life
assurance, voluntary contrib); non-salary (gross income + add multiple **relief
items** from a long list: pension, NHIS, NHF, rent relief, etc.). Footer note shows
active rule year. Submit → result page.

### Results `/calculator/result`
Clean breakdown: headline **annual tax** + **monthly tax**, taxable income,
**effective rate**, and an itemized **line-item table** (incomes vs deductions),
plus an assumptions note. Components used: SummaryStat, BreakdownCard, ResultRow,
AssumptionNote. *Redesign note:* add a simple chart (bracket bar / donut of
gross vs relief vs tax). Share / OG-image buttons.

### Leaderboard `/leaderboard`
Ranked list by total points: rank, avatar/handle, points, best streak. Top 3
highlighted (podium / gold-silver-bronze). Current user row pinned/highlighted.

### Glossary `/glossary`
Searchable list of tax terms with definitions; A–Z or category grouping.

### Forum list `/forum`
Hero card "Ask the questions payroll forgot to answer" + Start a thread.
Search bar; segmented tabs **New / Trending / Unanswered**; main column of
**ThreadCards** (title, snippet, tags, votes, reply count, author, time);
right sidebar: Popular tags, House rules, "Healthy forum" stats. Empty state.

### Thread `/forum/thread/[id]`
Thread header (title, tags, author, time, vote bar), markdown body, **posts/replies**
(nested, vote bars, accepted-answer highlight), reply composer, subscribe button,
report button, moderator bar (for mods: hide/lock/pin).

### New thread `/forum/new`
Title field, **markdown editor** with preview, tag chips, submit.

### Consultants landing `/consultants`
Hero "Talk to a Tax Consultant" + Browse / Become a Consultant CTAs;
**3-step "How it works"** cards; FAQ accordion.

### Browse consultants `/consultants/browse`
Grid of **consultant cards**: avatar, name, verified badge, specialties chips,
experience, rating + reviews count, location, availability status
(available/busy/unavailable), rate, "View profile". Filters/search by specialty.

### Consultant profile `/consultants/[consultantId]`
Header: avatar, name, verified badge, availability, rating, location, "Start chat".
Sections: bio, specialties, **qualifications**, **certifications** (e.g. ICAN, CITN),
work experience timeline, portfolio, rates (hourly / fixed range), stats
(total clients, projects, rating, reviews).

### Chat `/consultants/chat/[consultantId]`
Messaging UI: message bubbles (customer vs consultant), unread counts,
**special invoice messages** rendered as an invoice card inline, system messages,
composer; consultant can send an invoice from here.

### Invoices
- **Create** `/consultants/invoices/create`: title, description, line items
  (desc/qty/unit price/total), auto subtotal, **7.5% VAT**, Paystack fee, total,
  due date, currency ₦.
- **View** `/consultants/invoices/[invoiceId]`: full invoice, status chips,
  **Pay Now** (Paystack / Flutterwave buttons), payment + service status timeline.
- **Complete / Confirm / Refund** flows: mark done → 48h hold → release;
  customer confirm; refund request with reason.

### Consultant wallet `/consultants/wallet`
Balance, total earnings, withdrawn, pending; **wallet transaction** list
(credit/debit, fund hold states); withdraw to bank account; bank-account setup.

### Customer dashboard `/dashboard`
"My Dashboard". 4 **stat tiles**: Total Services, Pending Payment, In Progress,
Completed. Filter pills (All / Pending Payment / In Progress / Completed).
**Invoice list**: each row = status icon, title, description, invoice #, created
time, due date, big ₦ amount, Pay Now / View Details. Empty state.
*Redesign note:* this is the most "fintech dashboard" screen — give it the strongest
bento + data-viz treatment.

### News `/news` + `/news/[slug]`
List of article cards (thumbnail, category chip, title, excerpt, date, source,
Read more). Article page: clean reading layout, hero image, body (markdown),
source attribution. Empty state "No articles yet".

### Contact `/contact`
Simple contact form (name, email, message) + confirmation.

### Profile `/profile`
User handle + avatar, stats (points, streaks, badges), **notifications list**
(reply, mention, accepted answer, moderator action, thread activity), settings
links, upgrade-from-guest (anonymous → Google) prompt.

### Admin `/admin/*`
Utility/admin aesthetic with breadcrumb: dashboard cards; manage **consultants**
(approve/verify/suspend applications), **news** (CRUD + AI feed), **questions**
(quiz CRUD by level), **rules** (editable PAYE brackets/reliefs/personal
allowance), **transactions**, **moderation** queue (reports → action). Admin
login/register.

---

## 5. KEY ENTITIES (so Stitch knows what data shows)

- **Profile:** streakCount, bestStreak, totalPoints, levelUnlocked (1–3), badges[].
- **Badges:** Tax Rookie, PAYE Pro, Relief Ranger, Streak Starter, Hot Streak,
  Boss Level (each with emoji).
- **Question:** level, single/multi, prompt, 4 options, correct[], explanation, tags.
- **ForumThread:** title, body(markdown), tags, votes, replyCount, pinned/locked/
  hidden, acceptedPostId.
- **ConsultantProfile:** name, avatar, bio, specialties[], experienceYears,
  qualifications[], certifications[], workExperience[], portfolio[], hourlyRate /
  fixedRateRange, availabilityStatus, totalClients, totalProjects, averageRating,
  reviewsCount, isVerified.
- **Invoice:** invoiceNumber (INV-YYYYMMDD-XXXX), title, items[], subtotal, vat
  (7.5%), paystackFee, total, currency NGN, status, paymentStatus, serviceStatus,
  dueDate.
- **Wallet:** balance, totalEarnings, totalWithdrawn, totalPending (+ transactions).
- **PayeRules:** brackets[], reliefs, personalAllowance, year.

---

## 6. DESIGN SYSTEM TOKENS (target the redesign at these)

| Token | Light | Dark |
|---|---|---|
| Background | `#F5F5E8` | `#101C10` |
| Foreground | `#20241A` | `#F5FBE8` |
| Brand primary | `#006400` | `#0F7A2A` |
| Brand secondary | `#0B7A3B` | `#1EA34A` |
| Accent (gold) | `#C59F00` | `#FFD966` |
| Surface/card | `#F1F5E2` | `#182B18` |
| Border soft | `#D9E0C7` | `#243824` |
| Destructive | `#B91C1C` | — |

- **Radii:** cards 20–32px, buttons full-pill, chips full-pill.
- **Shadows:** soft layered (`0 18px 40px rgba(23,32,16,.14)`), green glow on focus.
- **Fonts:** Geist Sans (UI), Geist Mono (money/numbers).
- **Status colors:** pending = amber, in-progress = blue/green, completed = green,
  cancelled/failed = red, verified = green check, gold = premium/top-rank.

> Current code mixes a Nairaland-style green theme (CSS tokens) with leftover
> purple→blue gradients on individual pages. **The #1 ask for the redesign: unify
> everything onto the green + gold brand system above.**
