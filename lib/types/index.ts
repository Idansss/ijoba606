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
  moderationReason?: string; // Reason why content was moderated
  moderatedBy?: string; // UID of moderator
  moderatedAt?: Timestamp; // When moderation action was taken
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
export type ConsultantVerificationStatus = 'verified' | 'unverified';
export type ConsultantActivityStatus = 'active' | 'inactive' | 'suspended';

export interface ConsultantDocument {
  name: string;
  url: string;
  contentType?: string;
  size?: number;
  uploadedAt?: Timestamp;
}

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
  documents?: ConsultantDocument[];
  status: ConsultantApplicationStatus;
  verificationStatus?: ConsultantVerificationStatus;
  activityStatus?: ConsultantActivityStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Full Consultant Profile (after approval)
export interface ConsultantProfile {
  id?: string;
  uid: string; // Required - must be authenticated user
  // Basic Info
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  locationState?: string;
  profileImageUrl?: string;
  
  // Professional Details
  bio: string;
  specialties: string[]; // e.g., ['PAYE', 'Reliefs', 'Filing']
  experienceYears: number;
  qualifications: ConsultantQualification[];
  certifications: ConsultantCertification[];
  
  // Portfolio/Experience
  workExperience: ConsultantWorkExperience[];
  portfolioItems?: ConsultantPortfolioItem[];
  
  // Rates & Availability
  hourlyRate?: number; // in NGN
  fixedRateRange?: { min: number; max: number }; // in NGN
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  
  // Stats
  totalClients: number;
  totalProjects: number;
  averageRating?: number;
  reviewsCount: number;
  
  // Metadata
  isVerified: boolean; // Admin verified
  isActive: boolean;
  verificationStatus?: ConsultantVerificationStatus;
  activityStatus?: ConsultantActivityStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ConsultantQualification {
  id?: string;
  title: string; // e.g., "B.Sc Accounting"
  institution: string;
  year?: number;
  credentialUrl?: string;
}

export interface ConsultantCertification {
  id?: string;
  name: string; // e.g., "ICAN", "CITN"
  issuingBody: string;
  issueDate?: Timestamp;
  expiryDate?: Timestamp;
  credentialUrl?: string;
}

export interface ConsultantWorkExperience {
  id?: string;
  title: string; // e.g., "Senior Tax Consultant"
  company: string;
  startDate: Timestamp;
  endDate?: Timestamp; // null if current
  description?: string;
}

export interface ConsultantPortfolioItem {
  id?: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  projectUrl?: string;
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

// Chat System
export interface ConsultantChat {
  id?: string;
  consultantUid: string;
  customerUid: string;
  consultantName: string;
  customerName: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  unreadCountConsultant: number;
  unreadCountCustomer: number;
  status: 'active' | 'archived' | 'closed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatMessage {
  id?: string;
  chatId: string;
  senderUid: string;
  senderName: string;
  senderType: 'consultant' | 'customer';
  content: string;
  messageType: 'text' | 'invoice' | 'system'; // invoice = invoice shared, system = automated messages
  invoiceId?: string; // If messageType is 'invoice'
  isRead: boolean;
  createdAt: Timestamp;
}

// Invoice System
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Invoice {
  id?: string;
  invoiceNumber: string; // Auto-generated: INV-YYYYMMDD-XXXX
  consultantUid: string;
  customerUid: string;
  chatId?: string; // Associated chat if created from chat
  
  // Invoice Details
  title: string;
  description: string;
  items: InvoiceItem[];
  subtotal: number;
  vat?: number; // 7.5% VAT
  paystackFee?: number; // Paystack fee (1.5% + ₦100, customer bears)
  tax?: number; // Total tax (VAT + Paystack fee)
  total: number; // subtotal + vat + paystackFee
  currency: 'NGN';
  
  // Service Status
  serviceStatus?:
    | 'pending_payment'
    | 'in_progress'
    | 'pending_completion'
    | 'pending_confirmation'
    | 'pending_release'
    | 'completed'
    | 'cancelled'
    | 'disputed';
  
  // Payment
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'paystack' | 'bank_transfer' | 'other';
  paystackReference?: string; // Paystack transaction reference
  paidAt?: Timestamp;
  dueDate: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sentAt?: Timestamp;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number; // quantity * unitPrice
}

// Payment Transaction
export interface PaymentTransaction {
  id?: string;
  invoiceId: string;
  consultantUid: string;
  customerUid: string;
  amount: number;
  currency: 'NGN';
  status: PaymentStatus;
  paymentMethod: 'paystack' | 'bank_transfer' | 'other';
  paystackReference?: string;
  paystackTransactionId?: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// Consultant Wallet
export interface ConsultantWallet {
  id?: string;
  consultantUid: string;
  balance: number; // Current available balance (in kobo)
  totalEarnings: number; // All-time gross earnings (in kobo)
  totalWithdrawn: number; // Total amount withdrawn (in kobo)
  totalPending: number; // Pending withdrawal requests (in kobo)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Wallet Transaction
export type WalletTransactionType = 'credit' | 'debit';
export type WalletTransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface WalletTransaction {
  id?: string;
  consultantUid: string;
  type: WalletTransactionType;
  amount: number; // in kobo
  status: WalletTransactionStatus;
  description: string;
  invoiceId?: string; // If related to invoice payment
  withdrawalRequestId?: string; // If related to withdrawal
  refundRequestId?: string; // If related to refund
  paystackReference?: string;
  metadata?: Record<string, any>;
  // For pending funds
  fundStatus?: 'pending' | 'pending_release' | 'credited'; // pending = in service, pending_release = waiting for 48h hold, credited = available
  holdReleaseAt?: Timestamp; // When hold expires
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// Withdrawal Request
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface WithdrawalRequest {
  id?: string;
  consultantUid: string;
  amount: number; // in kobo
  status: WithdrawalStatus;
  bankAccount: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
    bankName: string;
  };
  paystackTransferCode?: string; // Paystack transfer reference
  failureReason?: string;
  createdAt: Timestamp;
  processedAt?: Timestamp;
  completedAt?: Timestamp;
}

// Bank Account (for both consultants and users)
export interface BankAccount {
  id?: string;
  uid: string; // User or consultant UID
  accountType: 'consultant' | 'user';
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Refund Request
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type RefundReason = 'service_not_provided' | 'poor_quality' | 'dispute' | 'other';

export interface RefundRequest {
  id?: string;
  invoiceId: string;
  transactionId: string;
  consultantUid: string;
  customerUid: string;
  amount: number; // in kobo
  reason: RefundReason;
  reasonDetails?: string;
  status: RefundStatus;
  bankAccount?: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
    bankName: string;
  }; // User's bank account for refund
  paystackRefundReference?: string;
  failureReason?: string;
  createdAt: Timestamp;
  processedAt?: Timestamp;
  completedAt?: Timestamp;
}

// Service Completion
export type ServiceCompletionStatus = 'pending_completion' | 'pending_confirmation' | 'confirmed' | 'disputed' | 'completed';
export type DisputeStatus = 'open' | 'resolved' | 'rejected';

export interface ServiceCompletion {
  id?: string;
  invoiceId: string;
  consultantUid: string;
  customerUid: string;
  status: ServiceCompletionStatus;
  completedAt?: Timestamp; // When consultant marked as done
  confirmedAt?: Timestamp; // When customer confirmed
  holdReleaseAt?: Timestamp; // When 48-hour hold expires
  disputeId?: string; // If disputed
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Dispute {
  id?: string;
  invoiceId: string;
  serviceCompletionId: string;
  consultantUid: string;
  customerUid: string;
  reason: string;
  details: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: string; // Admin UID
  resolvedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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

