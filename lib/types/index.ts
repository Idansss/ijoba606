import { Timestamp } from 'firebase/firestore';

// ==================== User & Profile ====================
export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  uid: string;
  handle: string;
  anon: boolean;
  role: UserRole;
  createdAt: Timestamp;
}

export interface Profile {
  uid: string;
  streakCount: number;
  bestStreak: number;
  lastPlayedLagosDate: string; // YYYY-MM-DD in Africa/Lagos
  totalPoints: number;
  levelUnlocked: 1 | 2 | 3;
  badges: string[];
}

// ==================== Quiz & Questions ====================
export type QuestionType = 'single' | 'multi';
export type QuizLevel = 1 | 2 | 3;

export interface Question {
  id: string;
  level: QuizLevel;
  type: QuestionType;
  prompt: string;
  topic?: string;
  options: [string, string, string, string];
  correct: number[]; // indices of correct options
  explanation?: string;
  tags?: string[];
}

export interface Round {
  id?: string;
  uid: string;
  level: QuizLevel;
  questionIds: [string, string, string];
  correctCount: number;
  attemptCount: number;
  totalScore: number;
  startedAt: Timestamp;
  finishedAt?: Timestamp;
}

export interface RoundAnswer {
  questionId: string;
  selectedOptions: number[];
  isCorrect: boolean;
  attempted: boolean;
}

// ==================== Badges ====================
export type BadgeType = 
  | 'tax_rookie'
  | 'paye_pro'
  | 'relief_ranger'
  | 'streak_starter'
  | 'hot_streak'
  | 'boss_level';

export interface Badge {
  id: BadgeType;
  name: string;
  description: string;
  emoji: string;
}

// ==================== Leaderboard ====================
export interface LeaderboardEntry {
  uid: string;
  handle?: string;
  totalPoints: number;
  bestStreak: number;
  updatedAt: Timestamp;
  rank?: number;
}

// ==================== Forum ====================
export interface ForumThread {
  id?: string;
  uid: string;
  title: string;
  bodyMD: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  votes: number;
  replyCount: number;
  isHidden: boolean;
  isLocked: boolean;
  isPinned: boolean;
  acceptedPostId?: string;
}

export interface ForumPost {
  id?: string;
  tid: string; // thread id
  uid: string;
  bodyMD: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  votes: number;
  isHidden: boolean;
  parentPostId?: string;
  mentionedUids?: string[];
  moderationReason?: string; // Reason why content was moderated
  moderatedBy?: string; // UID of moderator
  moderatedAt?: Timestamp; // When moderation action was taken
}

export interface ForumVote {
  value: 1 | -1;
  updatedAt: Timestamp;
}

export interface ForumReport {
  id?: string;
  targetKind: 'thread' | 'post';
  targetId: string;
  reporterUid: string;
  reason: string;
  text?: string;
  createdAt: Timestamp;
  status: 'open' | 'actioned';
}

export interface ForumTag {
  name: string;
  usageCount: number;
}

export interface ForumSubscription {
  tid: string;
  uid: string;
  createdAt: Timestamp;
}

// ==================== Notifications ====================
export type NotificationType = 
  | 'reply' 
  | 'mention' 
  | 'accepted_answer' 
  | 'moderator_action'
  | 'thread_activity';

export interface Notification {
  id?: string;
  type: NotificationType;
  ref: string; // reference id (thread/post)
  title: string;
  snippet: string;
  isRead: boolean;
  createdAt: Timestamp;
}

// ==================== Consultants ====================

export type ConsultantApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface ConsultantApplication {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  locationState?: string;
  experienceYears?: number;
  specialties: string[];
  bio: string;
  credentialsUrl?: string;
  status: ConsultantApplicationStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ConsultantRequestCategory = 'PAYE' | 'Reliefs' | 'Filing' | 'Employment' | 'Other';
export type ConsultantRequestUrgency = 'ASAP' | 'This week' | 'Later';
export type ConsultantRequestBudgetRange = 'Under ₦10k' | '₦10k–₦25k' | '₦25k–₦50k' | '₦50k+';

export interface ConsultantRequest {
  id?: string;
  uid?: string;
  name?: string;
  email: string;
  topic: string;
  category: ConsultantRequestCategory;
  urgency: ConsultantRequestUrgency;
  budgetRange?: ConsultantRequestBudgetRange;
  createdAt: Timestamp;
}

// ==================== Calculator ====================
export interface PayeRules {
  currency: 'NGN';
  year: number;
  reliefs: {
    pensionIsDeductible: boolean;
    nhfIsDeductible: boolean;
    lifeAssuranceCap?: number;
  };
  brackets: Array<{
    upTo: number; // NGN annual amount; Infinity for last bracket
    rate: number; // decimal, e.g., 0.07 = 7%
  }>;
  personalAllowance: {
    type: 'fixed' | 'percentOfGross' | 'hybrid';
    value: number; // if fixed: NGN amount; if percent: decimal; if hybrid: higher of 20% or fixed 200,000
  };
  notes: string;
}

export type ReliefType =
  | 'pension'
  | 'nhis'
  | 'nhf'
  | 'housing_interest'
  | 'life_insurance'
  | 'rent_relief'
  | 'gifts'
  | 'pension_funds'
  | 'retirement_benefits'
  | 'employment_compensation'
  | 'owner_occupied_house'
  | 'personal_effects'
  | 'private_vehicles'
  | 'share_gains'
  | 'share_gains_reinvested'
  | 'charity_religious';

export interface ReliefItem {
  type: ReliefType;
  amount: number;
  // For rent relief, store the annual rent to calculate 20%
  annualRent?: number;
}

export interface CalcInputs {
  earnerType: 'salary' | 'non-salary';
  period: 'monthly' | 'annual';
  // For salary earners
  basic?: number;
  housing?: number;
  transport?: number;
  other?: number;
  bonus?: number;
  pensionPct?: number;
  nhfEnabled?: boolean;
  nhfAmount?: number;
  lifeAssurance?: number;
  voluntaryContrib?: number;
  // For non-salary earners
  grossIncome?: number;
  reliefs?: ReliefItem[];
}

export interface CalcLineItem {
  label: string;
  amount: number;
  isDeduction?: boolean;
}

export interface CalcOutputs {
  annualTax: number;
  monthlyTax: number;
  taxableIncome: number;
  effectiveRate: number; // decimal
  lineItems: CalcLineItem[];
  assumptionsNote: string;
}

export interface CalcRun {
  id?: string;
  uid: string;
  inputs: CalcInputs;
  outputs: CalcOutputs;
  createdAt: Timestamp;
}

// ==================== Rate Limiting ====================
export interface RateLimit {
  events: Timestamp[];
}

