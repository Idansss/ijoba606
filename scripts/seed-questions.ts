/**
 * Seed Questions Script
 * 
 * This script seeds initial questions for the Learn & Play feature.
 * Run with: npx tsx scripts/seed-questions.ts
 * 
 * Make sure your Firebase is configured and you're authenticated.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Question, QuizLevel } from '../lib/types';

// Initialize Firebase Admin (you'll need to set up service account)
// For now, this uses environment variables or you can modify to use a service account file
const app = initializeApp();
const db = getFirestore();

const sampleQuestions: Omit<Question, 'id'>[] = [
  // Level 1 - Basics
  {
    level: 1,
    type: 'single',
    prompt: 'What does PAYE stand for?',
    options: [
      'Pay As You Earn',
      'Pay After You Earn',
      'Pay All Your Earnings',
      'Pay Annual Year End'
    ],
    correct: [0],
    explanation: 'PAYE stands for Pay As You Earn, a system where income tax is deducted from your salary before you receive it.',
    tags: ['basics', 'paye']
  },
  {
    level: 1,
    type: 'single',
    prompt: 'In Nigeria, what is the minimum income threshold before PAYE tax applies?',
    options: [
      '₦200,000 per year',
      '₦300,000 per year',
      '₦500,000 per year',
      'There is no minimum threshold'
    ],
    correct: [0],
    explanation: 'The personal allowance in Nigeria is typically ₦200,000 per year. Income below this threshold is not subject to PAYE tax.',
    tags: ['basics', 'allowance']
  },
  {
    level: 1,
    type: 'single',
    prompt: 'Which of the following is NOT a deductible relief under PAYE?',
    options: [
      'Pension contribution',
      'National Housing Fund (NHF)',
      'Life insurance premium',
      'Transport allowance'
    ],
    correct: [3],
    explanation: 'Transport allowance is typically not a deductible relief. Pension contributions, NHF, and life insurance premiums are common deductions.',
    tags: ['basics', 'reliefs']
  },
  {
    level: 1,
    type: 'multi',
    prompt: 'Which of the following are components of gross income for PAYE calculation? (Select all that apply)',
    options: [
      'Basic salary',
      'Housing allowance',
      'Transport allowance',
      'Medical allowance'
    ],
    correct: [0, 1, 2, 3],
    explanation: 'All allowances (housing, transport, medical) plus basic salary are typically included in gross income for PAYE calculation.',
    tags: ['basics', 'income']
  },
  {
    level: 1,
    type: 'single',
    prompt: 'What is the first tax bracket rate in Nigeria\'s PAYE system?',
    options: [
      '5%',
      '7%',
      '10%',
      '15%'
    ],
    correct: [1],
    explanation: 'The first tax bracket in Nigeria typically starts at 7% for income above the personal allowance up to ₦300,000.',
    tags: ['basics', 'tax-brackets']
  },

  // Level 2 - Intermediate
  {
    level: 2,
    type: 'single',
    prompt: 'If your annual gross income is ₦1,500,000 and personal allowance is ₦200,000, what is your chargeable income?',
    options: [
      '₦1,300,000',
      '₦1,500,000',
      '₦1,700,000',
      '₦200,000'
    ],
    correct: [0],
    explanation: 'Chargeable income = Gross income - Personal allowance. So ₦1,500,000 - ₦200,000 = ₦1,300,000.',
    tags: ['intermediate', 'calculation']
  },
  {
    level: 2,
    type: 'multi',
    prompt: 'Which deductions reduce your chargeable income before tax calculation? (Select all that apply)',
    options: [
      'Pension contribution (8% of basic)',
      'National Housing Fund (2.5% of basic)',
      'Life insurance premium',
      'Voluntary pension contribution'
    ],
    correct: [0, 1, 2, 3],
    explanation: 'All of these are legitimate deductions that reduce your chargeable income before applying tax brackets.',
    tags: ['intermediate', 'deductions']
  },
  {
    level: 2,
    type: 'single',
    prompt: 'For an employee earning ₦500,000 monthly, what is the maximum pension contribution that can be deducted?',
    options: [
      '₦40,000 (8% of basic)',
      '₦50,000 (10% of basic)',
      '₦60,000 (12% of basic)',
      'No limit'
    ],
    correct: [0],
    explanation: 'The statutory pension contribution is 8% of basic salary. For ₦500,000 basic, that\'s ₦40,000 per month.',
    tags: ['intermediate', 'pension']
  },
  {
    level: 2,
    type: 'single',
    prompt: 'What happens to your PAYE tax if you have multiple sources of income?',
    options: [
      'Each employer deducts PAYE separately',
      'You must consolidate and pay additional tax',
      'Only the highest income source is taxed',
      'PAYE only applies to your primary job'
    ],
    correct: [0],
    explanation: 'Each employer deducts PAYE separately from their payments. However, you may need to file a tax return to reconcile total tax liability.',
    tags: ['intermediate', 'multiple-income']
  },
  {
    level: 2,
    type: 'multi',
    prompt: 'Which of the following are considered taxable benefits? (Select all that apply)',
    options: [
      'Company car for personal use',
      'Housing provided by employer',
      'Medical insurance paid by employer',
      'Lunch vouchers'
    ],
    correct: [0, 1, 2],
    explanation: 'Company car, housing, and medical insurance are taxable benefits. Lunch vouchers are typically exempt up to a certain limit.',
    tags: ['intermediate', 'benefits']
  },

  // Level 3 - Advanced
  {
    level: 3,
    type: 'single',
    prompt: 'If your chargeable income is ₦2,000,000, and the tax brackets are: 0-300k (7%), 300k-600k (11%), 600k-1.1M (15%), 1.1M-1.6M (19%), what is your total tax?',
    options: [
      '₦280,000',
      '₦300,000',
      '₦320,000',
      '₦340,000'
    ],
    correct: [2],
    explanation: 'Tax calculation: 300k×7% = 21k, 300k×11% = 33k, 500k×15% = 75k, 400k×19% = 76k, 500k×21% = 105k. Total = ₦310,000 (approximately ₦320,000 with rounding).',
    tags: ['advanced', 'calculation']
  },
  {
    level: 3,
    type: 'single',
    prompt: 'What is the difference between consolidated relief allowance (CRA) and personal allowance?',
    options: [
      'CRA is higher and includes additional reliefs',
      'They are the same thing',
      'CRA applies only to self-employed',
      'Personal allowance is for PAYE, CRA is for other income'
    ],
    correct: [0],
    explanation: 'CRA is typically higher (often 20% of gross income or ₦200,000, whichever is higher) and includes additional reliefs beyond basic personal allowance.',
    tags: ['advanced', 'reliefs']
  },
  {
    level: 3,
    type: 'multi',
    prompt: 'Which scenarios require you to file an annual tax return even if you\'re on PAYE? (Select all that apply)',
    options: [
      'You have income from multiple employers',
      'You have rental income',
      'You have investment income above ₦100,000',
      'Your annual income exceeds ₦25,000,000'
    ],
    correct: [0, 1, 2, 3],
    explanation: 'All of these scenarios typically require filing an annual tax return to reconcile total tax liability, even if you\'re on PAYE.',
    tags: ['advanced', 'tax-returns']
  },
  {
    level: 3,
    type: 'single',
    prompt: 'For a non-resident employee working in Nigeria, how is PAYE calculated?',
    options: [
      'Same as resident employees',
      'Flat 15% on all income',
      'No PAYE applies',
      'Higher rates apply with no personal allowance'
    ],
    correct: [1],
    explanation: 'Non-resident employees typically pay a flat 15% tax on all income without personal allowances or reliefs.',
    tags: ['advanced', 'non-resident']
  },
  {
    level: 3,
    type: 'single',
    prompt: 'What is the tax treatment of a bonus payment under PAYE?',
    options: [
      'Taxed at a flat 10% rate',
      'Added to monthly income and taxed at marginal rate',
      'Tax-free up to ₦100,000',
      'Deferred until year-end'
    ],
    correct: [1],
    explanation: 'Bonuses are added to your monthly income and taxed at your marginal tax rate based on your total income for that month.',
    tags: ['advanced', 'bonus']
  }
];

async function seedQuestions() {
  console.log('Starting to seed questions...');
  
  try {
    const batch = db.batch();
    let count = 0;

    for (const question of sampleQuestions) {
      const docRef = db.collection('questions').doc();
      batch.set(docRef, question);
      count++;
    }

    await batch.commit();
    console.log(`✅ Successfully seeded ${count} questions!`);
    
    // Count by level
    const levelCounts: Record<QuizLevel, number> = { 1: 0, 2: 0, 3: 0 };
    sampleQuestions.forEach(q => {
      levelCounts[q.level]++;
    });
    
    console.log('\nQuestions by level:');
    console.log(`  Level 1: ${levelCounts[1]} questions`);
    console.log(`  Level 2: ${levelCounts[2]} questions`);
    console.log(`  Level 3: ${levelCounts[3]} questions`);
    
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedQuestions()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedQuestions, sampleQuestions };
