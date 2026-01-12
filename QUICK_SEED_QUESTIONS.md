# Quick Start: Seed Quiz Questions

## The Problem
You're seeing "Not enough questions for this level. Contact an admin" because there are no questions in Firestore yet.

## Quickest Solution: Manual Entry via Firebase Console

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com
2. Select your project: `ijoba606-778a1`
3. Go to **Firestore Database**

### Step 2: Create Questions Collection
1. Click **Start collection** (if no collections exist)
2. Collection ID: `questions`
3. Click **Next**

### Step 3: Add Your First Question
**Document ID:** Auto-generate (click "Auto-ID")

**Fields:**
- `level` (number): `1`
- `type` (string): `single`
- `prompt` (string): `What does PAYE stand for?`
- `options` (array): 
  ```
  Pay As You Earn
  Pay After You Earn
  Pay All Your Earnings
  Pay Annual Year End
  ```
- `correct` (array): `[0]` (first option is correct)
- `explanation` (string): `PAYE stands for Pay As You Earn, a system where income tax is deducted from your salary before you receive it.`
- `tags` (array): `["basics", "paye"]`

Click **Save**

### Step 4: Add More Questions
Repeat Step 3 for at least **3 questions per level** (minimum 9 total).

**Quick Copy-Paste Examples:**

#### Level 1 Question 2:
- `level`: `1`
- `type`: `single`
- `prompt`: `What is the personal allowance for PAYE in Nigeria?`
- `options`: `["₦200,000 per year", "₦300,000 per year", "₦500,000 per year", "No personal allowance"]`
- `correct`: `[0]`
- `explanation`: `The personal allowance in Nigeria is typically ₦200,000 per year.`
- `tags`: `["basics", "allowance"]`

#### Level 1 Question 3:
- `level`: `1`
- `type`: `single`
- `prompt`: `Which of the following is NOT a deductible relief under PAYE?`
- `options`: `["Pension contribution", "National Housing Fund (NHF)", "Life insurance premium", "Transport allowance"]`
- `correct`: `[3]`
- `explanation`: `Transport allowance is typically not a deductible relief.`
- `tags`: `["basics", "reliefs"]`

### Step 5: Test
1. Go back to your app
2. Navigate to `/play`
3. Select Level 1
4. Click "Start round"
5. It should work now! 🎉

## Alternative: Use AI Generation (After Setup)

Once you've deployed the `generateQuestions` function:

1. **Set OpenAI API Key:**
   ```bash
   # In Firebase Console → Functions → Configuration
   # Add environment variable: OPENAI_API_KEY = "your-key-here"
   ```

2. **Go to Admin Panel:**
   - Sign in as admin
   - Go to `/admin/questions`
   - Click "🤖 Generate with AI"
   - Select level, count, and topic
   - Click "Generate"

3. **Questions will be automatically created!**

## Minimum Requirements

- **Level 1**: At least 3 questions
- **Level 2**: At least 3 questions  
- **Level 3**: At least 3 questions

**Recommended:** 10-15 questions per level for variety.

## Need Help?

See `QUIZ_QUESTIONS_GUIDE.md` for detailed instructions on:
- Using the seed script
- AI-powered generation
- Bulk import
- Best practices
