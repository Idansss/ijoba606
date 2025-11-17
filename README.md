# IJBoba 606 — Learn • Play • Forum • Calculator (PAYE)

A mobile-first web application for making PAYE (Pay As You Earn) literacy engaging through quizzes, community discussions, and a practical tax calculator for Nigeria.

## Features

### 🎓 Learn & Play (Quizzes)
- **3-question rounds** with MCQ and multi-select questions
- **Scoring system**: +10 for correct answers, +2 for attempts
- **Badges**: Tax Rookie, PAYE Pro, Relief Ranger, Streak Starter, Hot Streak, Boss Level
- **Daily streaks** based on Africa/Lagos timezone
- **3 Progressive levels**: Basics (L1), Calculations (L2), Scenarios (L3)
- **Leaderboard**: Weekly + All-time Top 50

### 💬 Community Forum
- Create threads with markdown support and tags
- Reply, vote (upvote/downvote), and report content
- **Mention system** with `@username` suggestions
- Subscribe to threads for notifications
- **Moderation tools**: hide/lock/pin threads, accept answers
- Full-text search across threads
- Rate limiting and profanity filtering

### 🧮 Personal Income Tax Calculator
- **Monthly or Annual** calculation modes
- **Configurable PAYE rules** (admin-editable)
- Progressive tax brackets
- Deductions: Pension, NHF, Life Assurance, Voluntary Contributions
- Clean breakdown with line items
- Save calculations to profile
- Export/Print as PDF

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + class-variance-authority
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Validation**: Zod
- **Date Handling**: date-fns + date-fns-tz (Africa/Lagos)
- **Testing**: Vitest + React Testing Library
- **Markdown**: react-markdown + remark-gfm + rehype-sanitize

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Firebase project with:
  - Authentication (Anonymous + Google provider)
  - Firestore Database
  - Cloud Functions
  - App Check (optional but recommended)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ijoba606
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable **Anonymous** and **Google** providers
3. Create Firestore Database:
   - Go to Firestore Database > Create database
   - Start in **test mode** (we'll deploy rules later)
4. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" > Web app
   - Copy the configuration

### 3. Environment Variables

Create `.env.local` in the project root:

```bash
# Copy from .env.local.example
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Feature Flags
NEXT_PUBLIC_LEADERBOARD_ENABLED=true
```

### 4. Deploy Firestore Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select Firestore, Functions, Hosting)
firebase init

# Deploy rules
firebase deploy --only firestore:rules
```

### 5. Set Up Cloud Functions

The Cloud Functions are not included in this repository skeleton. You'll need to create them based on the interfaces in `lib/firebase/functions.ts`:

- `submitRound` - Validate and score quiz rounds
- `createThread`, `createPost` - Forum content creation
- `voteThread`, `votePost` - Voting system
- `reportContent`, `moderateContent` - Moderation
- `searchForum` - Full-text search
- `saveCalcRun` - Save calculator results
- `adminSetPayeRules` - Update tax rules (admin only)
- Scheduled: `rollWeeklyLeaderboards` (Mondays 00:05 Africa/Lagos)

Deploy functions:
```bash
firebase deploy --only functions
```

### 6. Seed Initial Data

#### Seed PAYE Rules

Create a document at `configs/payeRules` in Firestore with this structure:

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
    { "upTo": Infinity, "rate": 0.24 }
  ],
  "personalAllowance": {
    "type": "hybrid",
    "value": 200000
  },
  "notes": "Educational purposes only. Not legal or tax advice. Based on Nigeria PAYE 2025 estimates."
}
```

**Note**: Infinity should be stored as `9999999999` in Firestore

#### Seed Questions

Add sample questions to the `questions` collection. Example:

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
  "explanation": "PAYE stands for Pay As You Earn, a system where tax is deducted from your salary before you receive it.",
  "tags": ["basics"]
}
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
ijoba606/
├── app/                          # Next.js App Router pages
│   ├── play/                     # Quiz level selection
│   ├── round/                    # Active quiz round
│   ├── results/                  # Round results
│   ├── leaderboard/              # Leaderboard (weekly/all-time)
│   ├── profile/                  # User profile & badges
│   ├── calculator/               # Tax calculator
│   │   └── result/               # Calculator results
│   ├── forum/                    # Forum pages (to be implemented)
│   ├── admin/                    # Admin pages (to be implemented)
│   ├── legal/                    # Legal pages (to be implemented)
│   └── layout.tsx                # Root layout
├── components/
│   ├── layout/                   # Header, Footer
│   ├── providers/                # Auth provider
│   ├── ui/                       # Toast, shared components
│   ├── quiz/                     # Quiz components
│   ├── calculator/               # Calculator components
│   └── forum/                    # Forum components (to be implemented)
├── lib/
│   ├── firebase/                 # Firebase config, auth, functions
│   ├── store/                    # Zustand stores
│   ├── types/                    # TypeScript types
│   ├── utils/                    # Utilities (badges, scoring, streak, calculator, etc.)
│   └── validation/               # Zod schemas
├── firestore.rules               # Firestore security rules
├── vitest.config.ts              # Test configuration
└── package.json
```

## Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables from `.env.local`
4. Deploy!

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## Admin Panel

To make a user an admin:

1. Go to Firestore console
2. Navigate to `users/{uid}`
3. Update `role` field to `"admin"`
4. User can now access `/admin/questions` and `/admin/rules`

## Features to Implement

This is a comprehensive skeleton. The following features need full implementation:

- **Forum pages**: `/forum`, `/forum/new`, `/forum/thread/[id]`, etc.
- **Forum components**: ThreadCard, MarkdownEditor, Post, VoteBar, etc.
- **Cloud Functions**: All backend logic for quiz, forum, calculator
- **Admin pages**: Question CRUD, Rules editor, Moderation dashboard
- **Share/OG images**: Social sharing with custom images
- **Unit tests**: Comprehensive test coverage
- **Legal pages**: Privacy policy and Terms of Service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Made with 💜 for Nigeria 🇳🇬
