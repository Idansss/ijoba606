import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './config';
import type { Round, RoundAnswer, CalcInputs, CalcOutputs, PayeRules } from '@/lib/types';

type FirebaseFunctions = ReturnType<typeof getFunctions>;

let functions: FirebaseFunctions | null = null;

if (app) {
  try {
    // Specify region to match server-side function configuration
    functions = getFunctions(app, 'us-central1');
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Firebase Functions are disabled – set NEXT_PUBLIC_FIREBASE_* env vars to enable them.',
        error
      );
    } else {
      throw error;
    }
  }
}

function requireFunctions(): FirebaseFunctions {
  if (!functions) {
    throw new Error(
      'Cloud Functions are disabled. Add NEXT_PUBLIC_FIREBASE_* env vars to enable backend features.'
    );
  }

  return functions;
}

// ==================== Quiz Functions ====================

export interface SubmitRoundRequest {
  level: number;
  questionIds: [string, string, string];
  answers: RoundAnswer[];
}

export interface SubmitRoundResponse {
  round: Round;
  newBadges: string[];
  streakCount: number;
}

export async function submitRound(data: SubmitRoundRequest): Promise<SubmitRoundResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<SubmitRoundRequest, SubmitRoundResponse>(fns, 'submitRound');
  const result = await fn(data);
  return result.data;
}

// ==================== Forum Functions ====================

export interface CreateThreadRequest {
  title: string;
  bodyMD: string;
  tags: string[];
}

export interface CreateThreadResponse {
  threadId: string;
}

export async function createThread(data: CreateThreadRequest): Promise<CreateThreadResponse> {
  // Try Cloud Function first
  try {
    const fns = requireFunctions();
    const fn = httpsCallable<CreateThreadRequest, CreateThreadResponse>(fns, 'createThread');
    const result = await fn(data);
    return result.data;
  } catch (error: unknown) {
    // Fallback to direct Firestore write if Cloud Functions are not available
    // This is a temporary workaround until functions are deployed
    const errorObj = error as any;
    const errorCode = errorObj?.code || '';
    const errorMessage = errorObj?.message || '';
    const errorString = JSON.stringify(error);
    const errorName = errorObj?.name || '';
    
    // Log error for debugging
    console.log('createThread error:', { errorCode, errorMessage, errorName, error: errorObj });
    
    // Check for various error conditions that indicate functions aren't available
    const isCorsError = 
      errorMessage.includes('CORS') ||
      errorMessage.includes('Access-Control-Allow-Origin') ||
      errorString.includes('CORS') ||
      errorString.includes('Access-Control-Allow-Origin');
    
    const isFunctionUnavailable = 
      errorCode === 'functions/not-found' ||
      errorCode === 'functions/unavailable' ||
      errorCode === 'internal' ||
      errorCode === 'unavailable' ||
      errorCode === 'cancelled' ||
      (!isCorsError && (
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('ERR_FAILED') ||
        errorString.includes('Failed to fetch') ||
        errorString.includes('ERR_FAILED') ||
        errorString.includes('cloudfunctions.net')
      ));
    
    // If it's a CORS error, the function might be deployed but misconfigured
    if (isCorsError) {
      console.error('CORS error detected. Make sure the function is deployed and the region matches:', error);
      throw new Error('CORS error: The Cloud Function may not be deployed or the region configuration is incorrect. Please deploy functions with: firebase deploy --only functions');
    }
    
    // Only use fallback if function is truly unavailable (not CORS errors)
    if (isFunctionUnavailable) {
      console.log('Cloud Functions unavailable, using Firestore fallback');
      
      try {
        // Import Firestore functions dynamically to avoid circular dependencies
        const { collection, addDoc, Timestamp, doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('./config');
        const { getCurrentUser } = await import('./auth');
        
        const user = getCurrentUser();
        if (!user || !db) {
          throw new Error('User must be signed in and Firestore must be initialized');
        }
        
        // Create thread directly in Firestore
        const threadRef = await addDoc(collection(db, 'forumThreads'), {
          uid: user.uid,
          title: data.title.trim(),
          bodyMD: data.bodyMD.trim(),
          tags: data.tags,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          votes: 0,
          replyCount: 0,
          isLocked: false,
          isPinned: false,
          isHidden: false,
        });
        
        console.log('Thread created via Firestore fallback:', threadRef.id);
        
        // Update tag usage counts (if allowed by rules, otherwise skip)
        try {
          for (const tag of data.tags) {
            const tagRef = doc(db, 'forumTags', tag);
            await setDoc(tagRef, {
              name: tag,
              usageCount: 1, // Note: Can't use increment without Functions
            }, { merge: true });
          }
        } catch (tagError) {
          // Tag updates might fail due to rules, but thread creation should succeed
          console.warn('Could not update tag usage counts:', tagError);
        }
        
        return { threadId: threadRef.id };
      } catch (fallbackError) {
        // If fallback also fails, log and throw original error
        console.error('Firestore fallback also failed:', fallbackError);
        throw error;
      }
    }
    
    // If we get here, it's not a function availability error, re-throw
    console.error('createThread error (not caught by fallback):', error);
    throw error;
  }
}

export interface CreatePostRequest {
  tid: string;
  bodyMD: string;
  parentPostId?: string;
  mentionedUids?: string[];
}

export interface CreatePostResponse {
  postId: string;
}

export async function createPost(data: CreatePostRequest): Promise<CreatePostResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<CreatePostRequest, CreatePostResponse>(fns, 'createPost');
  const result = await fn(data);
  return result.data;
}

export interface VoteRequest {
  targetId: string;
  value: 1 | -1 | 0; // 0 to remove vote
}

export interface VoteResponse {
  newVoteCount: number;
}

export async function voteThread(data: VoteRequest): Promise<VoteResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<VoteRequest, VoteResponse>(fns, 'voteThread');
  const result = await fn(data);
  return result.data;
}

export async function votePost(data: VoteRequest): Promise<VoteResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<VoteRequest, VoteResponse>(fns, 'votePost');
  const result = await fn(data);
  return result.data;
}

export interface ReportContentRequest {
  targetKind: 'thread' | 'post';
  targetId: string;
  reason: string;
  text?: string;
}

export interface ReportContentResponse {
  reportId: string;
}

export async function reportContent(data: ReportContentRequest): Promise<ReportContentResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<ReportContentRequest, ReportContentResponse>(
    fns,
    'reportContent'
  );
  const result = await fn(data);
  return result.data;
}

export interface ModerateContentRequest {
  targetKind: 'thread' | 'post';
  targetId: string;
  action: 'hide' | 'unhide' | 'lock' | 'unlock' | 'pin' | 'unpin' | 'accept_answer';
}

export interface ModerateContentResponse {
  success: boolean;
}

export async function moderateContent(
  data: ModerateContentRequest
): Promise<ModerateContentResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<ModerateContentRequest, ModerateContentResponse>(
    fns,
    'moderateContent'
  );
  const result = await fn(data);
  return result.data;
}

export interface SearchForumRequest {
  query: string;
  limit?: number;
}

export interface SearchForumResponse {
  threads: Array<{ id: string; title: string; snippet: string }>;
}

export async function searchForum(data: SearchForumRequest): Promise<SearchForumResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<SearchForumRequest, SearchForumResponse>(fns, 'searchForum');
  const result = await fn(data);
  return result.data;
}

// ==================== Calculator Functions ====================

export interface SaveCalcRunRequest {
  inputs: CalcInputs;
  outputs: CalcOutputs;
}

export interface SaveCalcRunResponse {
  runId: string;
}

export async function saveCalcRun(data: SaveCalcRunRequest): Promise<SaveCalcRunResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<SaveCalcRunRequest, SaveCalcRunResponse>(fns, 'saveCalcRun');
  const result = await fn(data);
  return result.data;
}

export interface SetPayeRulesRequest {
  rules: PayeRules;
}

export interface SetPayeRulesResponse {
  success: boolean;
}

export async function adminSetPayeRules(data: SetPayeRulesRequest): Promise<SetPayeRulesResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<SetPayeRulesRequest, SetPayeRulesResponse>(
    fns,
    'adminSetPayeRules'
  );
  const result = await fn(data);
  return result.data;
}

// ==================== Quiz/Question Functions ====================

export interface GenerateQuestionsRequest {
  level: 1 | 2 | 3;
  topic?: string;
  count?: number;
  useAI?: boolean;
}

export interface GenerateQuestionsResponse {
  success: boolean;
  questionIds: string[];
  count: number;
}

export async function generateQuestions(
  data: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<GenerateQuestionsRequest, GenerateQuestionsResponse>(
    fns,
    'generateQuestions'
  );
  const result = await fn(data);
  return result.data;
}

// ==================== Consultants Functions ====================

export interface CreateConsultantApplicationRequest {
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  locationState?: string;
  experienceYears?: number;
  specialties: string[];
  bio: string;
  credentialsUrl?: string;
}

export interface CreateConsultantApplicationResponse {
  applicationId: string;
}

export async function createConsultantApplication(
  data: CreateConsultantApplicationRequest
): Promise<CreateConsultantApplicationResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<CreateConsultantApplicationRequest, CreateConsultantApplicationResponse>(
    fns,
    'createConsultantApplication'
  );
  const result = await fn(data);
  return result.data;
}

export interface CreateConsultantRequestRequest {
  name?: string;
  email: string;
  topic: string;
  category: 'PAYE' | 'Reliefs' | 'Filing' | 'Employment' | 'Other';
  urgency: 'ASAP' | 'This week' | 'Later';
  budgetRange?: 'Under ₦10k' | '₦10k–₦25k' | '₦25k–₦50k' | '₦50k+';
}

export interface CreateConsultantRequestResponse {
  requestId: string;
}

export async function createConsultantRequest(
  data: CreateConsultantRequestRequest
): Promise<CreateConsultantRequestResponse> {
  const fns = requireFunctions();
  const fn = httpsCallable<CreateConsultantRequestRequest, CreateConsultantRequestResponse>(
    fns,
    'createConsultantRequest'
  );
  const result = await fn(data);
  return result.data;
}

