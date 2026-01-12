import { z } from 'zod';

// ==================== Calculator Schemas ====================

const reliefItemSchema = z.object({
  type: z.enum([
    'pension',
    'nhis',
    'nhf',
    'housing_interest',
    'life_insurance',
    'rent_relief',
    'gifts',
    'pension_funds',
    'retirement_benefits',
    'employment_compensation',
    'owner_occupied_house',
    'personal_effects',
    'private_vehicles',
    'share_gains',
    'share_gains_reinvested',
    'charity_religious',
  ]),
  amount: z.number().min(0),
  annualRent: z.number().min(0).optional(),
});

export const calcInputsSchema = z.object({
  earnerType: z.enum(['salary', 'non-salary']),
  period: z.enum(['monthly', 'annual']),
  // For salary earners (optional, used when earnerType === 'salary')
  basic: z.number().min(0).optional(),
  housing: z.number().min(0).optional(),
  transport: z.number().min(0).optional(),
  other: z.number().min(0).optional(),
  bonus: z.number().min(0).optional(),
  pensionPct: z.number().min(0).max(100).optional(),
  nhfEnabled: z.boolean().optional(),
  nhfAmount: z.number().min(0).optional(),
  lifeAssurance: z.number().min(0).optional(),
  voluntaryContrib: z.number().min(0).optional(),
  // For non-salary earners (optional, used when earnerType === 'non-salary')
  grossIncome: z.number().min(1, 'Total income is required and must be greater than 0'),
  reliefs: z.array(reliefItemSchema).optional(),
});

export type CalcInputsFormData = z.infer<typeof calcInputsSchema>;

// ==================== Forum Schemas ====================

export const createThreadSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  bodyMD: z
    .string()
    .min(20, 'Body must be at least 20 characters')
    .max(5000, 'Body must be less than 5000 characters'),
  tags: z
    .array(z.string())
    .min(1, 'Select at least 1 tag')
    .max(3, 'Select at most 3 tags'),
});

export type CreateThreadFormData = z.infer<typeof createThreadSchema>;

export const createPostSchema = z.object({
  bodyMD: z
    .string()
    .min(10, 'Reply must be at least 10 characters')
    .max(3000, 'Reply must be less than 3000 characters'),
});

export type CreatePostFormData = z.infer<typeof createPostSchema>;

export const reportContentSchema = z.object({
  reason: z.string().min(1, 'Please select a reason'),
  text: z.string().max(500, 'Additional details must be less than 500 characters').optional(),
});

export type ReportContentFormData = z.infer<typeof reportContentSchema>;

// ==================== Admin Schemas ====================

export const questionSchema = z.object({
  level: z.number().int().min(1).max(3),
  type: z.enum(['single', 'multi']),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  options: z.tuple([
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
  ]),
  correct: z.array(z.number().int().min(0).max(3)).min(1),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type QuestionFormData = z.infer<typeof questionSchema>;

export const payeRulesSchema = z.object({
  currency: z.literal('NGN'),
  year: z.number().int().min(2020).max(2100),
  reliefs: z.object({
    pensionIsDeductible: z.boolean(),
    nhfIsDeductible: z.boolean(),
    lifeAssuranceCap: z.number().min(0).optional(),
  }),
  brackets: z.array(
    z.object({
      upTo: z.number().min(0),
      rate: z.number().min(0).max(1),
    })
  ),
  personalAllowance: z.object({
    type: z.enum(['fixed', 'percentOfGross', 'hybrid']),
    value: z.number().min(0),
  }),
  notes: z.string(),
});

export type PayeRulesFormData = z.infer<typeof payeRulesSchema>;

// ==================== Consultants Schemas ====================

// Simple spam/profanity blocklist (can be enhanced later)
const BLOCKLIST = [
  'spam',
  'test',
  'fake',
  // Add more as needed
];

function containsBlocklist(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKLIST.some((word) => lower.includes(word));
}

export const consultantApplicationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .refine((val) => !containsBlocklist(val), 'Please provide a valid name'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(20, 'Phone must be less than 20 characters')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Phone must contain only numbers and valid characters'),
  whatsapp: z
    .string()
    .max(20, 'WhatsApp must be less than 20 characters')
    .regex(/^[\d\s\-\+\(\)]*$/, 'WhatsApp must contain only numbers and valid characters')
    .optional(),
  locationState: z.string().max(100, 'State must be less than 100 characters').optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
  specialties: z
    .array(z.string())
    .min(1, 'Select at least one specialty')
    .max(5, 'Select at most 5 specialties'),
  bio: z
    .string()
    .min(50, 'Bio must be at least 50 characters')
    .max(1000, 'Bio must be less than 1000 characters')
    .refine((val) => !containsBlocklist(val), 'Please provide a valid bio'),
  credentialsUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

export type ConsultantApplicationFormData = z.infer<typeof consultantApplicationSchema>;

export const consultantRequestSchema = z.object({
  name: z.string().max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Please enter a valid email address'),
  topic: z
    .string()
    .min(10, 'Topic must be at least 10 characters')
    .max(500, 'Topic must be less than 500 characters')
    .refine((val) => !containsBlocklist(val), 'Please provide a valid topic'),
  category: z.enum(['PAYE', 'Reliefs', 'Filing', 'Employment', 'Other']),
  urgency: z.enum(['ASAP', 'This week', 'Later']),
  budgetRange: z.enum(['Under ₦10k', '₦10k–₦25k', '₦25k–₦50k', '₦50k+']).optional(),
});

export type ConsultantRequestFormData = z.infer<typeof consultantRequestSchema>;

