import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './config';
import type { Round, RoundAnswer, CalcInputs, CalcOutputs, PayeRules } from '@/lib/types';

type FirebaseFunctions = ReturnType<typeof getFunctions>;

let functions: FirebaseFunctions | null = null;

if (app) {
  try {
    functions = getFunctions(app);
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
    const errorString = String(error);
    
    // Check for various error conditions that indicate functions aren't available
    const isFunctionUnavailable = 
      errorCode === 'functions/not-found' ||
      errorCode === 'functions/unavailable' ||
      errorCode === 'internal' ||
      errorCode === 'unavailable' ||
      errorMessage.includes('CORS') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('network') ||
      errorString.includes('CORS') ||
      errorString.includes('Failed to fetch') ||
      errorString.includes('ERR_FAILED');
    
    if (isFunctionUnavailable) {
      
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
    }
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

