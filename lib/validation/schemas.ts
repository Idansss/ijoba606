import { z } from 'zod';

// ==================== Calculator Schemas ====================

export const calcInputsSchema = z.object({
  period: z.enum(['monthly', 'annual']),
  basic: z.number().min(0, 'Basic salary must be positive'),
  housing: z.number().min(0, 'Housing allowance must be positive'),
  transport: z.number().min(0, 'Transport allowance must be positive'),
  other: z.number().min(0, 'Other allowance must be positive'),
  bonus: z.number().min(0, 'Bonus must be positive'),
  pensionPct: z.number().min(0).max(100, 'Pension percentage must be 0-100'),
  nhfEnabled: z.boolean(),
  nhfAmount: z.number().min(0).optional(),
  lifeAssurance: z.number().min(0).optional(),
  voluntaryContrib: z.number().min(0).optional(),
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

