# Quiz Questions Guide - Learn & Play Feature

This guide explains how to populate and manage quiz questions for the Learn & Play feature.

## Problem

The quiz system requires at least **3 questions per level** to work. If you see the error "Not enough questions for this level. Contact an admin", it means there aren't enough questions in Firestore for that level.

## Solutions

### Option 1: Quick Seed (Recommended for Getting Started)

Use the seed script to add 15 sample questions (5 per level):

```bash
# Make sure you have Firebase Admin SDK set up
# You'll need to configure Firebase Admin credentials

# Option A: Using Firebase CLI (if you're logged in)
firebase functions:shell
# Then import and run the seed function

# Option B: Using a Node script
# First, install dependencies
npm install firebase-admin

# Create a script runner (see scripts/seed-questions-runner.ts)
npx tsx scripts/seed-questions-runner.ts
```

**Note:** The seed script includes 15 pre-written questions covering:
- Level 1: Basics (PAYE definition, personal allowance, reliefs, tax brackets)
- Level 2: Intermediate (calculations, deductions, multiple income, benefits)
- Level 3: Advanced (complex calculations, tax returns, non-resident, bonuses)

### Option 2: Manual Entry via Admin Panel

1. Sign in as an admin user
2. Go to `/admin/questions`
3. Click "Add Question"
4. Fill in the form:
   - **Level**: 1 (Basics), 2 (Intermediate), or 3 (Advanced)
   - **Type**: Single answer or Multiple answer
   - **Prompt**: The question text
   - **Options**: 4 answer choices
   - **Correct**: Select which option(s) are correct
   - **Explanation**: Why the answer is correct
   - **Tags**: Optional tags for categorization

### Option 3: AI-Powered Question Generation (Automated)

Use the Cloud Function to generate questions automatically using AI.

#### Setup

1. **Get an OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key

2. **Add to Firebase Functions Environment:**
   ```bash
   firebase functions:config:set openai.api_key="your-api-key-here"
   ```
   
   Or for v2 functions, add to `.env` or Firebase Console:
   - Go to Firebase Console → Functions → Configuration
   - Add environment variable: `OPENAI_API_KEY`

3. **Deploy the Function:**
   ```bash
   firebase deploy --only functions:generateQuestions
   ```

#### Usage

**Via Admin Panel (Recommended):**
- Add a "Generate Questions" button to `/admin/questions` page
- Or call the function directly from browser console (if you're an admin)

**Via Cloud Function Call:**
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const generateQuestions = httpsCallable(functions, 'generateQuestions');

// Generate 5 questions for level 1
const result = await generateQuestions({
  level: 1,
  count: 5,
  useAI: true, // Set to false to use template-based generation
  topic: 'PAYE basics' // Optional
});

console.log('Generated questions:', result.data.questionIds);
```

**Via Firebase Console:**
- Go to Functions → `generateQuestions`
- Click "Test" tab
- Enter test data:
  ```json
  {
    "level": 1,
    "count": 5,
    "useAI": true,
    "topic": "PAYE basics"
  }
  ```

#### AI Generation Parameters

- **level** (required): 1, 2, or 3
- **count** (optional): Number of questions to generate (1-10, default: 1)
- **topic** (optional): Specific topic to focus on (e.g., "pension", "tax brackets", "deductions")
- **useAI** (optional): true to use OpenAI, false to use template fallback (default: true)

### Option 4: Bulk Import from JSON

Create a JSON file with questions and import via script:

```json
[
  {
    "level": 1,
    "type": "single",
    "prompt": "What does PAYE stand for?",
    "options": ["Pay As You Earn", "Pay After You Earn", "Pay All Your Earnings", "Pay Annual Year End"],
    "correct": [0],
    "explanation": "PAYE stands for Pay As You Earn.",
    "tags": ["basics"]
  }
]
```

Then use a script to import to Firestore.

## Question Structure

Each question must have:

```typescript
{
  level: 1 | 2 | 3,           // Required: Quiz level
  type: 'single' | 'multi',   // Required: Single or multiple correct answers
  prompt: string,              // Required: The question text (min 10 chars)
  options: [string, string, string, string], // Required: Exactly 4 options
  correct: number[],           // Required: Array of correct option indices (0-3)
  explanation?: string,        // Optional: Explanation of the answer
  tags?: string[],            // Optional: Tags for categorization
  topic?: string              // Optional: Topic category
}
```

## Best Practices

1. **Minimum Questions:** Have at least 10-15 questions per level to ensure variety
2. **Question Quality:**
   - Make questions practical and relevant to Nigerian PAYE
   - Test understanding, not just memorization
   - Include clear explanations
   - Use realistic scenarios and amounts

3. **Level Distribution:**
   - **Level 1**: Basic concepts, definitions, simple facts
   - **Level 2**: Calculations, deductions, intermediate scenarios
   - **Level 3**: Complex scenarios, tax returns, edge cases

4. **Topics to Cover:**
   - PAYE basics and definitions
   - Personal allowance and reliefs
   - Tax brackets and rates
   - Deductions (pension, NHF, insurance)
   - Gross income components
   - Multiple income sources
   - Taxable benefits
   - Bonuses and special payments
   - Tax returns and filing
   - Non-resident taxation

## Cost Considerations (AI Generation)

- **OpenAI GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Generating 5 questions typically costs: **$0.01 - $0.05**
- Template-based generation is free but limited

## Troubleshooting

**"Not enough questions for this level"**
- Check Firestore `questions` collection
- Filter by `level` field
- Ensure at least 3 questions exist for that level

**AI Generation Fails**
- Check `OPENAI_API_KEY` is set
- Verify API key is valid and has credits
- Check function logs in Firebase Console
- Function will fallback to template-based generation if AI fails

**Questions Not Appearing**
- Check Firestore security rules allow read access
- Verify questions have correct `level` field
- Check browser console for errors

## Next Steps

1. **Start with seed script** to get 15 questions quickly
2. **Use AI generation** to expand question bank
3. **Manually add** specialized questions as needed
4. **Review and curate** AI-generated questions for quality

## Support

For issues or questions:
- Check Firebase Console → Functions → Logs
- Review Firestore data in Firebase Console
- Check browser console for client-side errors
