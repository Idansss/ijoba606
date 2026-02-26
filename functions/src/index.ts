import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { generateQuestionsWithOpenAI, generateQuestionsWithGemini, generateQuestionsWithCursor, generateQuestionsFromTemplate } from "./generateQuestion";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Note: Secrets set via `firebase functions:secrets:set` are automatically available via process.env

// Note: CORS is automatically handled for onCall (callable) functions in v2
// Region configuration for v2 functions
const region = "us-central1"; // Default region, change if needed

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Global limits (cost protection)
setGlobalOptions({ maxInstances: 10 });

/* ---------------------------------
   VALIDATION SCHEMAS
----------------------------------*/

const ConsultantApplicationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  whatsapp: z.string().min(7).max(20).optional(),
  locationState: z.string().optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  specialties: z.array(z.string()).min(1).max(5),
  bio: z.string().min(20).max(1000),
  credentialsUrl: z.string().url().optional().or(z.literal("")),
  documents: z
    .array(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
        contentType: z.string().optional(),
        size: z.number().int().min(1).optional(),
      })
    )
    .optional(),
});

const ConsultantRequestSchema = z.object({
  email: z.string().email(),
  topic: z.string().min(10).max(500),
  category: z.enum(["PAYE", "Reliefs", "Filing", "Employment", "Other"]),
  urgency: z.enum(["ASAP", "This week", "Later"]),
  budgetRange: z.string().optional(),
});

const CreateThreadSchema = z.object({
  title: z.string().min(10).max(200),
  bodyMD: z.string().min(20).max(5000),
  tags: z.array(z.string()).min(1).max(3),
});

const CreatePostSchema = z.object({
  tid: z.string().min(1),
  bodyMD: z.string().min(10).max(3000),
  parentPostId: z.string().optional(),
  mentionedUids: z.array(z.string()).optional(),
});

const VoteSchema = z.object({
  targetId: z.string().min(1),
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

const ReportContentSchema = z.object({
  targetKind: z.enum(["thread", "post"]),
  targetId: z.string().min(1),
  reason: z.string().min(1),
  text: z.string().optional(),
});

const ModerateContentSchema = z.object({
  targetKind: z.enum(["thread", "post"]),
  targetId: z.string().min(1),
  action: z.enum(["hide", "unhide", "lock", "unlock", "pin", "unpin", "accept_answer", "delete"]),
  reason: z.string().optional(), // Reason for moderation action
});

/* ---------------------------------
   CONSULTANT APPLICATION
----------------------------------*/
export const createConsultantApplication = onCall(
  { region },
  async (request) => {
  const uid = request.auth?.uid ?? null;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const parsed = ConsultantApplicationSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid application data");
  }

  const data = parsed.data;

  await db.collection("consultantApplications").doc(uid).set({
    uid,
    ...data,
    status: "pending",
    verificationStatus: "unverified",
    activityStatus: "inactive",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  logger.info("Consultant application submitted", { email: data.email });

  return { applicationId: uid };
  }
);

/* ---------------------------------
   CONSULTANT REQUEST (WAITLIST)
----------------------------------*/
export const createConsultantRequest = onCall(
  { region },
  async (request) => {
  const uid = request.auth?.uid ?? null;

  const parsed = ConsultantRequestSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid request data");
  }

  const data = parsed.data;

  await db.collection("consultantRequests").add({
    uid,
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });

  logger.info("Consultant request submitted", { email: data.email });

  return { success: true };
  }
);

/* ---------------------------------
   FORUM: CREATE THREAD
----------------------------------*/
export const createThread = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const uid = request.auth.uid;

  // Validate input
  const parsed = CreateThreadSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid thread data");
  }

  const { title, bodyMD, tags } = parsed.data;

  // Create thread
  const threadRef = await db.collection("forumThreads").add({
    uid,
    title: title.trim(),
    bodyMD: bodyMD.trim(),
    tags,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    votes: 0,
    replyCount: 0,
    isLocked: false,
    isPinned: false,
    isHidden: false,
  });

  // Update tag usage counts
  for (const tag of tags) {
    const tagRef = db.collection("forumTags").doc(tag);
    await tagRef.set(
      {
        name: tag,
        usageCount: FieldValue.increment(1),
      },
      { merge: true }
    );
  }

  logger.info("Thread created", { threadId: threadRef.id, uid });

  return { threadId: threadRef.id };
});

/* ---------------------------------
   FORUM: CREATE POST (REPLY)
----------------------------------*/
export const createPost = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const uid = request.auth.uid;

  // Validate input
  const parsed = CreatePostSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid post data");
  }

  const { tid, bodyMD, parentPostId, mentionedUids } = parsed.data;

  // Check if thread exists and is not locked
  const threadRef = db.collection("forumThreads").doc(tid);
  const threadSnap = await threadRef.get();

  if (!threadSnap.exists) {
    throw new HttpsError("not-found", "Thread not found");
  }

  const threadData = threadSnap.data();
  if (threadData?.isLocked) {
    throw new HttpsError("failed-precondition", "Thread is locked");
  }

  // Create post
  const postRef = await db.collection("forumPosts").add({
    tid,
    uid,
    bodyMD: bodyMD.trim(),
    parentPostId: parentPostId || null,
    mentionedUids: mentionedUids || [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    votes: 0,
    isHidden: false,
  });

  // Update thread reply count
  await threadRef.update({
    replyCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.info("Post created", { postId: postRef.id, tid, uid });

  return { postId: postRef.id };
});

/* ---------------------------------
   FORUM: VOTE THREAD
----------------------------------*/
export const voteThread = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const uid = request.auth.uid;

  // Validate input
  const parsed = VoteSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid vote data");
  }

  const { targetId, value } = parsed.data;

  // Get current vote - path: forumVotes/thread/{targetId}/userVotes/{uid}
  // The path structure in Firestore rules suggests: forumVotes -> {kind} -> {targetId} -> userVotes -> {uid}
  // But in practice, {uid} should be the document. Let's use: forumVotes -> thread -> {targetId} -> {uid}
  // Actually, based on rules, it's: forumVotes -> thread (doc) -> {targetId} (collection) -> userVotes (doc) -> {uid} (collection)
  // But that doesn't work. Let's try: forumVotes -> thread -> {targetId} -> {uid} directly
  const voteRef = db
    .collection("forumVotes")
    .doc("thread")
    .collection(targetId)
    .doc(uid);
  
  let currentVote = 0;
  try {
    const voteSnap = await voteRef.get();
    if (voteSnap.exists) {
      currentVote = voteSnap.data()?.value || 0;
    }
  } catch (error: any) {
    // If document doesn't exist or path is invalid, currentVote remains 0
    logger.warn("Vote document not found or error reading", { targetId, uid, error: error?.message });
  }

  const voteDiff = value - currentVote;

  // Update user vote
  try {
    if (value === 0) {
      await voteRef.delete();
    } else {
      await voteRef.set({
        value,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (error: any) {
    logger.error("Error updating vote", { targetId, uid, value, error: error?.message });
    throw new HttpsError("internal", `Failed to update vote: ${error?.message || "Unknown error"}`);
  }

  // Update thread vote count
  const threadRef = db.collection("forumThreads").doc(targetId);
  await threadRef.update({
    votes: FieldValue.increment(voteDiff),
  });

  // Get updated vote count
  const threadSnap = await threadRef.get();
  const newVoteCount = threadSnap.data()?.votes || 0;

  logger.info("Thread voted", { targetId, uid, value, newVoteCount });

  return { newVoteCount };
});

/* ---------------------------------
   FORUM: VOTE POST
----------------------------------*/
export const votePost = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const uid = request.auth.uid;

  // Validate input
  const parsed = VoteSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid vote data");
  }

  const { targetId, value } = parsed.data;

  // Get current vote - path: forumVotes/post/{targetId}/userVotes/{uid}
  // Using simplified structure: forumVotes -> post -> {targetId} -> {uid}
  const voteRef = db
    .collection("forumVotes")
    .doc("post")
    .collection(targetId)
    .doc(uid);
  
  let currentVote = 0;
  try {
    const voteSnap = await voteRef.get();
    if (voteSnap.exists) {
      currentVote = voteSnap.data()?.value || 0;
    }
  } catch (error: any) {
    // If document doesn't exist or path is invalid, currentVote remains 0
    logger.warn("Vote document not found or error reading", { targetId, uid, error: error?.message });
  }

  const voteDiff = value - currentVote;

  // Update user vote
  try {
    if (value === 0) {
      await voteRef.delete();
    } else {
      await voteRef.set({
        value,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (error: any) {
    logger.error("Error updating vote", { targetId, uid, value, error: error?.message });
    throw new HttpsError("internal", `Failed to update vote: ${error?.message || "Unknown error"}`);
  }

  // Update post vote count
  const postRef = db.collection("forumPosts").doc(targetId);
  await postRef.update({
    votes: FieldValue.increment(voteDiff),
  });

  // Get updated vote count
  const postSnap = await postRef.get();
  const newVoteCount = postSnap.data()?.votes || 0;

  logger.info("Post voted", { targetId, uid, value, newVoteCount });

  return { newVoteCount };
});

/* ---------------------------------
   FORUM: REPORT CONTENT
----------------------------------*/
export const reportContent = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const uid = request.auth.uid;

  // Validate input
  const parsed = ReportContentSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid report data");
  }

  const { targetKind, targetId, reason, text } = parsed.data;

  // Create report
  const reportRef = await db.collection("forumReports").add({
    targetKind,
    targetId,
    reporterUid: uid,
    reason,
    text: text || "",
    createdAt: FieldValue.serverTimestamp(),
    status: "open",
  });

  logger.info("Content reported", {
    reportId: reportRef.id,
    targetKind,
    targetId,
    reporterUid: uid,
  });

  return { reportId: reportRef.id };
});

/* ---------------------------------
   FORUM: MODERATE CONTENT
----------------------------------*/
export const moderateContent = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const uid = request.auth.uid;

  // Check if user is moderator or admin
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new HttpsError("permission-denied", "User not found");
  }

  const userData = userSnap.data();
  const role = userData?.role;

  if (role !== "moderator" && role !== "admin") {
    throw new HttpsError("permission-denied", "Moderator access required");
  }

  // Validate input
  const parsed = ModerateContentSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid moderation data");
  }

  const { targetKind, targetId, action, reason } = parsed.data;

  // Determine collection
  const collection = targetKind === "thread" ? "forumThreads" : "forumPosts";
  const targetRef = db.collection(collection).doc(targetId);

  // Verify target exists
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    throw new HttpsError("not-found", `${targetKind} not found`);
  }

  // Prepare moderation metadata
  const moderationData: any = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  
  // Add reason and moderator info for actions that modify content
  if (reason && reason.trim() && ['hide', 'delete'].includes(action)) {
    moderationData.moderationReason = reason.trim();
    moderationData.moderatedBy = uid;
    moderationData.moderatedAt = FieldValue.serverTimestamp();
  }

  // Perform action
  switch (action) {
    case "hide":
      await targetRef.update({
        isHidden: true,
        ...moderationData,
      });
      break;
    case "unhide":
      await targetRef.update({
        isHidden: false,
        moderationReason: FieldValue.delete(), // Remove reason when unhiding
        moderatedBy: FieldValue.delete(),
        moderatedAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      break;
    case "delete":
      // Delete the content
      await targetRef.delete();
      logger.info("Content deleted", { targetKind, targetId, uid, reason });
      return { success: true, deleted: true };
    case "lock":
      if (targetKind === "thread") {
        await targetRef.update({
          isLocked: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        throw new HttpsError("invalid-argument", "Cannot lock posts");
      }
      break;
    case "unlock":
      if (targetKind === "thread") {
        await targetRef.update({
          isLocked: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        throw new HttpsError("invalid-argument", "Cannot unlock posts");
      }
      break;
    case "pin":
      if (targetKind === "thread") {
        await targetRef.update({
          isPinned: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        throw new HttpsError("invalid-argument", "Cannot pin posts");
      }
      break;
    case "unpin":
      if (targetKind === "thread") {
        await targetRef.update({
          isPinned: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        throw new HttpsError("invalid-argument", "Cannot unpin posts");
      }
      break;
    case "accept_answer":
      if (targetKind === "post") {
        // Mark this post as accepted answer
        const postData = targetSnap.data();
        const threadId = postData?.tid;
        if (threadId) {
          // Update thread to mark this as accepted answer
          await db.collection("forumThreads").doc(threadId).update({
            acceptedPostId: targetId,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      } else {
        throw new HttpsError("invalid-argument", "Can only accept posts as answers");
      }
      break;
    default:
      throw new HttpsError("invalid-argument", `Unknown action: ${action}`);
  }

  logger.info("Content moderated", {
    targetKind,
    targetId,
    action,
    moderatorUid: uid,
  });

  return { success: true };
});

/* ---------------------------------
   QUIZ: GENERATE QUESTIONS (AI)
----------------------------------*/
const GenerateQuestionsSchema = z.object({
  level: z.number().int().min(1).max(3),
  topic: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  count: z.number().int().min(1).max(10).default(1),
  provider: z.enum(['openai', 'gemini', 'cursor', 'template']).default('openai'),
});

export const generateQuestions = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  // Check if user is admin
  const uid = request.auth.uid;
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new HttpsError("permission-denied", "User not found");
  }

  const userData = userSnap.data();
  const role = userData?.role;

  if (role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required");
  }

  // Validate input
  logger.info("Received generateQuestions request", { data: request.data });
  const parsed = GenerateQuestionsSchema.safeParse(request.data);
  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map((issue: any) => 
      `${issue.path.join('.')}: ${issue.message}`
    ).join(', ');
    logger.error("Validation failed", { issues: parsed.error.issues, data: request.data });
    throw new HttpsError("invalid-argument", `Invalid generation data: ${errorMessages}`);
  }

  const { level, topic, count, provider } = parsed.data;

  try {
    let questions;
    let source = provider;

    if (provider === 'openai') {
      try {
        const aiResult = await generateQuestionsWithOpenAI({
          level: level as 1 | 2 | 3,
          topic,
          count,
        });
        questions = aiResult.questions;
        logger.info("Questions generated with OpenAI", { level, topic, count: questions.length });
      } catch (aiError: any) {
        logger.warn("OpenAI generation failed, trying Gemini", { error: aiError?.message });
          // Fallback to Gemini
          try {
            const geminiResult = await generateQuestionsWithGemini({
              level: level as 1 | 2 | 3,
              topic,
              count,
            });
          questions = geminiResult.questions;
          source = 'gemini';
          logger.info("Questions generated with Gemini (fallback)", { level, topic, count: questions.length });
        } catch (geminiError: any) {
          logger.warn("Gemini generation also failed, using template fallback", { error: geminiError?.message });
          // Final fallback to template
          const templateResult = generateQuestionsFromTemplate({
            level: level as 1 | 2 | 3,
            topic,
            count,
          });
          questions = templateResult.questions;
          source = 'template';
        }
      }
    } else if (provider === 'gemini') {
      try {
        const geminiResult = await generateQuestionsWithGemini({
          level: level as 1 | 2 | 3,
          topic,
          count,
        });
        questions = geminiResult.questions;
        logger.info("Questions generated with Gemini", { level, topic, count: questions.length });
      } catch (geminiError: any) {
        logger.warn("Gemini generation failed, using template fallback", { error: geminiError?.message });
        // Fallback to template
        const templateResult = generateQuestionsFromTemplate({
          level: level as 1 | 2 | 3,
          topic,
          count,
        });
        questions = templateResult.questions;
        source = 'template';
      }
    } else if (provider === 'cursor') {
      try {
        const cursorResult = await generateQuestionsWithCursor({
          level: level as 1 | 2 | 3,
          topic,
          count,
        });
        questions = cursorResult.questions;
        logger.info("Questions generated with Cursor", { level, topic, count: questions.length });
      } catch (cursorError: any) {
        logger.warn("Cursor generation failed, using template fallback", { error: cursorError?.message });
        // Fallback to template
        const templateResult = generateQuestionsFromTemplate({
          level: level as 1 | 2 | 3,
          topic,
          count,
        });
        questions = templateResult.questions;
        source = 'template';
      }
    } else {
      // Use template-based generation
      const templateResult = generateQuestionsFromTemplate({
        level: level as 1 | 2 | 3,
        topic,
        count,
      });
      questions = templateResult.questions;
      source = 'template';
    }

    // Validate that we have questions
    if (!questions || questions.length === 0) {
      logger.error("No questions generated", { level, topic, count, provider });
      throw new HttpsError("internal", "Failed to generate questions. Please try again or use a different provider.");
    }

    // Log warning if fewer questions than requested
    if (questions.length < count) {
      logger.warn("Generated fewer questions than requested", {
        requested: count,
        generated: questions.length,
        level,
        topic,
        provider,
      });
    }

    // Save questions to Firestore
    const batch = db.batch();
    const questionIds: string[] = [];

    // Helper function to remove undefined values (Firestore doesn't accept undefined)
    // Also handles nested objects and arrays
    const removeUndefined = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return null;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => removeUndefined(item)).filter(item => item !== undefined);
      }
      
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            // Recursively clean nested objects
            cleaned[key] = removeUndefined(value);
          }
        }
        return cleaned;
      }
      
      return obj;
    };

    for (const question of questions) {
      const docRef = db.collection("questions").doc();
      // Build question object, explicitly excluding undefined topic
      const questionToSave: any = {
        level: question.level,
        type: question.type,
        prompt: question.prompt,
        options: question.options,
        correct: question.correct,
        explanation: question.explanation,
        tags: question.tags || [],
        createdAt: FieldValue.serverTimestamp(),
        createdBy: uid,
        source: source,
      };
      
      // Only add topic if it exists and is not empty
      if (question.topic && typeof question.topic === 'string' && question.topic.trim()) {
        questionToSave.topic = question.topic.trim();
      }
      
      // Remove any remaining undefined values
      const cleanedQuestion = removeUndefined(questionToSave);
      batch.set(docRef, cleanedQuestion);
      questionIds.push(docRef.id);
    }

    await batch.commit();

    logger.info("Questions saved to Firestore", {
      level,
      count: questionIds.length,
      questionIds,
    });

    return {
      success: true,
      questionIds,
      count: questionIds.length,
    };
  } catch (error: any) {
    logger.error("Error generating questions", { error: error?.message, level, topic });
    throw new HttpsError("internal", `Failed to generate questions: ${error?.message || "Unknown error"}`);
  }
});

/* ---------------------------------
   QUIZ: SUBMIT ROUND (SCORING)
----------------------------------*/
const SubmitRoundSchema = z.object({
  level: z.number().int().min(1).max(3),
  questionIds: z.array(z.string()).length(3),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOptions: z.array(z.number()),
    isCorrect: z.boolean(),
    attempted: z.boolean(),
  })).length(3),
});

export const submitRound = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const uid = request.auth.uid;

  // Validate input
  const parsed = SubmitRoundSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid round data");
  }

  const { level, questionIds, answers } = parsed.data;

  // Calculate score
  let correctCount = 0;
  let attemptCount = 0;

  for (const answer of answers) {
    if (answer.attempted) attemptCount++;
    if (answer.isCorrect) correctCount++;
  }

  const totalScore = correctCount * 10 + attemptCount * 2;

  // Get or create profile FIRST (before creating round)
  const profileRef = db.collection("profiles").doc(uid);
  const profileSnap = await profileRef.get();
  const profile = profileSnap.exists ? profileSnap.data() : null;

  // Calculate average score for level unlocking BEFORE creating new round
  // Get all existing rounds for this user to calculate average
  const roundsRef = db.collection("rounds");
  const roundsQuery = roundsRef.where("uid", "==", uid);
  const roundsSnapshot = await roundsQuery.get();
  
  let totalScoreSum = 0;
  let roundCount = 0;
  roundsSnapshot.forEach((doc) => {
    const roundData = doc.data();
    totalScoreSum += roundData.totalScore || 0;
    roundCount++;
  });
  
  // Include current round in average calculation
  totalScoreSum += totalScore;
  roundCount++;
  const averageScore = roundCount > 0 ? totalScoreSum / roundCount : 0;

  // Determine level unlocked based on average score
  // Level 2: average >= 20/30 (66.7%)
  // Level 3: average >= 24/30 (80%)
  let levelUnlocked: 1 | 2 | 3 = profile?.levelUnlocked || 1;
  if (averageScore >= 24) {
    levelUnlocked = 3;
  } else if (averageScore >= 20) {
    levelUnlocked = 2;
  }

  // Update streak (Africa/Lagos timezone)
  const { formatInTimeZone } = await import("date-fns-tz");
  const today = formatInTimeZone(new Date(), "Africa/Lagos", "yyyy-MM-dd");
  const lastPlayed = profile?.lastPlayedLagosDate || "";

  let newStreak = 1;
  if (lastPlayed === today) {
    newStreak = profile?.streakCount || 1;
  } else if (lastPlayed) {
    // Check if consecutive day
    const prevDate = new Date(lastPlayed);
    const currDate = new Date(today);
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      newStreak = (profile?.streakCount || 0) + 1;
    }
  }

  const bestStreak = Math.max(newStreak, profile?.bestStreak || 0);
  const newTotalPoints = (profile?.totalPoints || 0) + totalScore;
  const newRoundsCompleted = (profile?.roundsCompleted || 0) + 1;

  // Create round document
  const roundRef = await db.collection("rounds").add({
    uid,
    level,
    questionIds,
    answers,
    correctCount,
    attemptCount,
    totalScore,
    startedAt: FieldValue.serverTimestamp(),
    finishedAt: FieldValue.serverTimestamp(),
  });

  // Evaluate badges
  const currentBadges = profile?.badges || [];
  const newBadges: string[] = [];
  
  // Tax Rookie: First round
  if (newRoundsCompleted === 1 && !currentBadges.includes('tax_rookie')) {
    newBadges.push('tax_rookie');
  }
  
  // PAYE Pro: Score 24+ in a round
  if (totalScore >= 24 && !currentBadges.includes('paye_pro')) {
    newBadges.push('paye_pro');
  }
  
  // Streak Starter: 3-day streak
  if (newStreak >= 3 && !currentBadges.includes('streak_starter')) {
    newBadges.push('streak_starter');
  }
  
  // Hot Streak: 7-day streak
  if (newStreak >= 7 && !currentBadges.includes('hot_streak')) {
    newBadges.push('hot_streak');
  }
  
  // Boss Level: Score 26+ on Level 3
  if (level === 3 && totalScore >= 26 && !currentBadges.includes('boss_level')) {
    newBadges.push('boss_level');
  }

  // Update profile
  await profileRef.set(
    {
      uid,
      totalPoints: newTotalPoints,
      streakCount: newStreak,
      bestStreak,
      lastPlayedLagosDate: today,
      roundsCompleted: newRoundsCompleted,
      levelUnlocked,
      badges: newBadges.length > 0 
        ? [...currentBadges, ...newBadges] 
        : currentBadges,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Update leaderboards
  const weeklyRef = db.collection("leaderboards").doc("weekly").collection("entries").doc(uid);
  const alltimeRef = db.collection("leaderboards").doc("alltime").collection("entries").doc(uid);

  // Get user handle
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const handle = userSnap.exists ? userSnap.data()?.handle || "Anonymous" : "Anonymous";

  await weeklyRef.set(
    {
      uid,
      handle,
      totalPoints: newTotalPoints,
      bestStreak,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await alltimeRef.set(
    {
      uid,
      handle,
      totalPoints: newTotalPoints,
      bestStreak,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  logger.info("Round submitted", { 
    uid, 
    level, 
    totalScore, 
    newStreak, 
    levelUnlocked,
    averageScore: averageScore.toFixed(2),
    newBadges: newBadges.length 
  });

  return {
    round: {
      id: roundRef.id,
      totalScore,
      correctCount,
      attemptCount,
    },
    newBadges,
    streakCount: newStreak,
  };
});

/* ---------------------------------
   PAYSTACK WEBHOOK HANDLER
----------------------------------*/

// Verify Paystack webhook signature
function verifyPaystackSignature(payload: string, signature: string, secret: string): boolean {
  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");
  return hash === signature;
}

function verifyFlutterwaveSignature(signature: string, secret: string): boolean {
  return !!signature && !!secret && signature === secret;
}

const getFlutterwaveMetadata = (data: any) => data?.meta || data?.metadata || {};

const toNumber = (value: any) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

async function processFlutterwavePayment({
  txRef,
  transactionId,
  amount,
  currency,
  metadata,
}: {
  txRef?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, any>;
}) {
  if (!txRef && !metadata?.invoiceId && !metadata?.invoice_id) {
    return { status: "missing_reference" as const };
  }

  const invoicesRef = db.collection("invoices");
  let invoiceDoc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot | null = null;

  if (txRef) {
    const invoiceQuery = await invoicesRef
      .where("flutterwaveReference", "==", txRef)
      .limit(1)
      .get();

    if (!invoiceQuery.empty) {
      invoiceDoc = invoiceQuery.docs[0];
    }
  }

  const metadataInvoiceId = metadata?.invoiceId || metadata?.invoice_id;
  if (!invoiceDoc && metadataInvoiceId) {
    const invoiceSnap = await invoicesRef.doc(metadataInvoiceId).get();
    if (invoiceSnap.exists) {
      invoiceDoc = invoiceSnap;
    }
  }

  if (!invoiceDoc || !invoiceDoc.exists) {
    return { status: "invoice_not_found" as const };
  }

  const invoiceData = invoiceDoc.data() as any;

  if (invoiceData.paymentStatus === "completed" || invoiceData.status === "paid") {
    return { status: "already_processed" as const, invoiceId: invoiceDoc.id };
  }

  if (txRef) {
    const existingTx = await db
      .collection("paymentTransactions")
      .where("flutterwaveReference", "==", txRef)
      .limit(1)
      .get();

    if (!existingTx.empty) {
      return { status: "already_processed" as const, invoiceId: invoiceDoc.id };
    }
  }

  const amountInNaira = toNumber(amount) || toNumber(invoiceData.total);
  const invoiceSubtotal = toNumber(invoiceData.subtotal);
  const invoiceVAT = toNumber(invoiceData.vat);
  const consultantEarnings = invoiceSubtotal + invoiceVAT;

  await invoiceDoc.ref.update({
    paymentStatus: "completed",
    status: "paid",
    paidAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    serviceStatus: "in_progress",
    paymentMethod: "flutterwave",
    flutterwaveReference: txRef || invoiceData.flutterwaveReference,
    flutterwaveTransactionId: transactionId || invoiceData.flutterwaveTransactionId,
  });

  const transactionRef = db.collection("paymentTransactions").doc();
  await transactionRef.set({
    invoiceId: invoiceDoc.id,
    consultantUid: invoiceData.consultantUid,
    customerUid: invoiceData.customerUid,
    amount: amountInNaira,
    currency: currency || invoiceData.currency || "NGN",
    status: "completed",
    paymentMethod: "flutterwave",
    flutterwaveReference: txRef,
    flutterwaveTransactionId: transactionId,
    metadata: metadata || {},
    createdAt: FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
  });

  const walletRef = db.collection("consultantWallets").doc(invoiceData.consultantUid);
  const walletDoc = await walletRef.get();

  if (walletDoc.exists) {
    await walletRef.update({
      balance: FieldValue.increment(consultantEarnings * 100),
      totalEarnings: FieldValue.increment(consultantEarnings * 100),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await walletRef.set({
      consultantUid: invoiceData.consultantUid,
      balance: consultantEarnings * 100,
      totalEarnings: consultantEarnings * 100,
      totalWithdrawn: 0,
      totalPending: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  const walletTransactionRef = db.collection("walletTransactions").doc();
  await walletTransactionRef.set({
    consultantUid: invoiceData.consultantUid,
    type: "credit",
    amount: consultantEarnings * 100,
    status: "completed",
    description: `Payment received for invoice ${invoiceData.invoiceNumber}`,
    invoiceId: invoiceDoc.id,
    flutterwaveReference: txRef,
    createdAt: FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
  });

  const customerNotifRef = db
    .collection("notifications")
    .doc(invoiceData.customerUid)
    .collection("items")
    .doc();
  await customerNotifRef.set({
    type: "payment_completed",
    ref: invoiceDoc.id,
    title: "Payment Successful",
    snippet: `Your payment of ₦${amountInNaira.toLocaleString()} for invoice ${invoiceData.invoiceNumber} was successful.`,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  const consultantNotifRef = db
    .collection("notifications")
    .doc(invoiceData.consultantUid)
    .collection("items")
    .doc();
  await consultantNotifRef.set({
    type: "payment_received",
    ref: invoiceDoc.id,
    title: "Payment Received",
    snippet: `You received ₦${consultantEarnings.toLocaleString()} for invoice ${invoiceData.invoiceNumber}.`,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { status: "processed" as const, invoiceId: invoiceDoc.id };
}

export const handlePaystackWebhook = onRequest(
  {
    region,
    cors: true,
  },
  async (req, res) => {
    try {
      const signature = req.headers["x-paystack-signature"] as string;
      const secret = process.env.PAYSTACK_SECRET_KEY || "";

      if (!signature || !secret) {
        logger.error("Missing Paystack signature or secret key");
        res.status(400).send("Missing signature or secret");
        return;
      }

      // Verify signature
      const payload = JSON.stringify(req.body);
      if (!verifyPaystackSignature(payload, signature, secret)) {
        logger.error("Invalid Paystack signature");
        res.status(401).send("Invalid signature");
        return;
      }

      const event = req.body;
      logger.info("Paystack webhook received", { event: event.event });

      // Handle different event types
      if (event.event === "charge.success") {
        const { reference, amount, metadata } = event.data;

        // Find invoice by Paystack reference
        const invoicesRef = db.collection("invoices");
        const invoiceQuery = await invoicesRef
          .where("paystackReference", "==", reference)
          .limit(1)
          .get();

        if (invoiceQuery.empty) {
          logger.warn("Invoice not found for reference", { reference });
          res.status(200).send("Invoice not found");
          return;
        }

        const invoiceDoc = invoiceQuery.docs[0];
        const invoiceData = invoiceDoc.data();

        // Update invoice
        await invoiceDoc.ref.update({
          paymentStatus: "completed",
          status: "paid",
          paidAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          serviceStatus: "in_progress", // Start service after payment
        });

        // Create payment transaction
        const transactionRef = db.collection("paymentTransactions").doc();
        await transactionRef.set({
          invoiceId: invoiceDoc.id,
          consultantUid: invoiceData.consultantUid,
          customerUid: invoiceData.customerUid,
          amount: amount / 100, // Convert from kobo to naira
          currency: "NGN",
          status: "completed",
          paymentMethod: "paystack",
          paystackReference: reference,
          paystackTransactionId: event.data.id,
          metadata: metadata || {},
          createdAt: FieldValue.serverTimestamp(),
          completedAt: FieldValue.serverTimestamp(),
        });

        // Credit consultant wallet
        const walletRef = db.collection("consultantWallets").doc(invoiceData.consultantUid);
        const walletDoc = await walletRef.get();

        const invoiceSubtotal = invoiceData.subtotal || 0;
        const invoiceVAT = invoiceData.vat || 0;
        const consultantEarnings = invoiceSubtotal + invoiceVAT; // Consultant gets subtotal + VAT, not Paystack fee

        if (walletDoc.exists) {
          await walletRef.update({
            balance: FieldValue.increment(consultantEarnings * 100), // Convert to kobo
            totalEarnings: FieldValue.increment(consultantEarnings * 100),
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Create credit transaction
          const walletTransactionRef = db.collection("walletTransactions").doc();
          await walletTransactionRef.set({
            consultantUid: invoiceData.consultantUid,
            type: "credit",
            amount: consultantEarnings * 100,
            status: "completed",
            description: `Payment received for invoice ${invoiceData.invoiceNumber}`,
            invoiceId: invoiceDoc.id,
            paystackReference: reference,
            createdAt: FieldValue.serverTimestamp(),
            completedAt: FieldValue.serverTimestamp(),
          });
        } else {
          // Create new wallet
          await walletRef.set({
            consultantUid: invoiceData.consultantUid,
            balance: consultantEarnings * 100,
            totalEarnings: consultantEarnings * 100,
            totalWithdrawn: 0,
            totalPending: 0,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

          // Create credit transaction
          const walletTransactionRef = db.collection("walletTransactions").doc();
          await walletTransactionRef.set({
            consultantUid: invoiceData.consultantUid,
            type: "credit",
            amount: consultantEarnings * 100,
            status: "completed",
            description: `Payment received for invoice ${invoiceData.invoiceNumber}`,
            invoiceId: invoiceDoc.id,
            paystackReference: reference,
            createdAt: FieldValue.serverTimestamp(),
            completedAt: FieldValue.serverTimestamp(),
          });
        }

        // Send notification to customer
        const customerNotifRef = db
          .collection("notifications")
          .doc(invoiceData.customerUid)
          .collection("items")
          .doc();
        await customerNotifRef.set({
          type: "payment_completed",
          ref: invoiceDoc.id,
          title: "Payment Successful",
          snippet: `Your payment of ₦${(amount / 100).toLocaleString()} for invoice ${invoiceData.invoiceNumber} was successful.`,
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        });

        // Send notification to consultant
        const consultantNotifRef = db
          .collection("notifications")
          .doc(invoiceData.consultantUid)
          .collection("items")
          .doc();
        await consultantNotifRef.set({
          type: "payment_received",
          ref: invoiceDoc.id,
          title: "Payment Received",
          snippet: `You received ₦${consultantEarnings.toLocaleString()} for invoice ${invoiceData.invoiceNumber}.`,
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        });

        logger.info("Payment processed successfully", { invoiceId: invoiceDoc.id, reference });
      }

      res.status(200).send("Webhook processed");
    } catch (error) {
      logger.error("Error processing Paystack webhook", error);
      res.status(500).send("Error processing webhook");
    }
  }
);

/* ---------------------------------
   FLUTTERWAVE WEBHOOK + VERIFY
----------------------------------*/
export const handleFlutterwaveWebhook = onRequest(
  {
    region,
    cors: true,
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
      }

      const signature = req.headers["verif-hash"] as string;
      const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET || "";

      if (!verifyFlutterwaveSignature(signature, secret)) {
        logger.error("Invalid Flutterwave signature");
        res.status(401).send("Invalid signature");
        return;
      }

      const event = req.body;
      const eventType = event?.event;
      const eventData = event?.data;
      logger.info("Flutterwave webhook received", { event: eventType });

      if (eventType !== "charge.completed") {
        res.status(200).send("Event ignored");
        return;
      }

      if (eventData?.status !== "successful") {
        res.status(200).send("Charge not successful");
        return;
      }

      const metadata = getFlutterwaveMetadata(eventData);
      const result = await processFlutterwavePayment({
        txRef: eventData?.tx_ref,
        transactionId: eventData?.id ? String(eventData.id) : undefined,
        amount: toNumber(eventData?.amount),
        currency: eventData?.currency,
        metadata,
      });

      logger.info("Flutterwave webhook processed", result);
      res.status(200).send("Webhook processed");
    } catch (error) {
      logger.error("Error processing Flutterwave webhook", error);
      res.status(500).send("Error processing webhook");
    }
  }
);

export const verifyFlutterwavePayment = onCall(
  { region },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in");
    }

    const { txRef, transactionId } = request.data || {};
    if (!txRef && !transactionId) {
      throw new HttpsError("invalid-argument", "Missing txRef or transactionId");
    }

    const secret = process.env.FLUTTERWAVE_SECRET_KEY || "";
    if (!secret) {
      throw new HttpsError("failed-precondition", "Missing Flutterwave secret key");
    }

    const endpoint = transactionId
      ? `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`
      : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`;

    const fetchFn = (globalThis as any).fetch;
    if (!fetchFn) {
      throw new HttpsError("failed-precondition", "Fetch API is not available in this runtime");
    }

    const response = await fetchFn(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new HttpsError("internal", `Flutterwave verify failed: ${text}`);
    }

    const payload = await response.json();
    const status = payload?.status;
    const data = payload?.data;

    if (status !== "success" || data?.status !== "successful") {
      return { verified: false, status: data?.status || status };
    }

    const metadata = getFlutterwaveMetadata(data);
    const result = await processFlutterwavePayment({
      txRef: data?.tx_ref || txRef,
      transactionId: data?.id ? String(data.id) : transactionId,
      amount: toNumber(data?.amount),
      currency: data?.currency,
      metadata,
    });

    return { verified: true, ...result };
  }
);

/* ---------------------------------
   CHAT NOTIFICATIONS
----------------------------------*/

export const sendChatNotification = onCall(
  {
    region,
  },
  async (request) => {
    const { chatId, messageId, senderUid, recipientUid, messageContent } = request.data;

    if (!chatId || !messageId || !senderUid || !recipientUid) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    try {
      // Create notification for recipient
      const notifRef = db
        .collection("notifications")
        .doc(recipientUid)
        .collection("items")
        .doc();

      await notifRef.set({
        type: "chat_message",
        ref: chatId,
        title: "New Message",
        snippet: messageContent || "You have a new message",
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Update chat unread count
      const chatRef = db.collection("consultantChats").doc(chatId);
      const chatDoc = await chatRef.get();

      if (chatDoc.exists) {
        const chatData = chatDoc.data();
        if (chatData?.consultantUid === recipientUid) {
          await chatRef.update({
            unreadCountConsultant: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else if (chatData?.customerUid === recipientUid) {
          await chatRef.update({
            unreadCountCustomer: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      logger.info("Chat notification sent", { chatId, recipientUid });
      return { success: true };
    } catch (error) {
      logger.error("Error sending chat notification", error);
      throw new HttpsError("internal", "Failed to send notification");
    }
  }
);

/* ---------------------------------
   EMAIL INTEGRATION
----------------------------------*/

// Initialize email transporter (configure with your email service)
const getEmailTransporter = () => {
  // For Gmail, use OAuth2 or App Password
  // For production, use SendGrid, Mailgun, or AWS SES
  return nodemailer.createTransport({
    service: "gmail", // Change to your email service
    auth: {
      user: process.env.EMAIL_USER || "",
      pass: process.env.EMAIL_PASSWORD || "", // Use App Password for Gmail
    },
  });
};

export const sendInvoiceEmail = onCall(
  {
    region,
  },
  async (request) => {
    const { invoiceId, customerEmail, consultantName, invoiceNumber, total } = request.data;

    if (!invoiceId || !customerEmail) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    try {
      const transporter = getEmailTransporter();
      const invoiceUrl = `https://ijoba606.com/consultants/invoices/${invoiceId}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || "noreply@ijoba606.com",
        to: customerEmail,
        subject: `Invoice ${invoiceNumber} from ${consultantName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Invoice ${invoiceNumber}</h2>
            <p>Dear Customer,</p>
            <p>You have received an invoice from <strong>${consultantName}</strong>.</p>
            <p><strong>Total Amount:</strong> ₦${total.toLocaleString()}</p>
            <p>Please click the link below to view and pay your invoice:</p>
            <a href="${invoiceUrl}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              View Invoice
            </a>
            <p>If you have any questions, please contact your consultant.</p>
            <p>Best regards,<br>IJOBA 606 Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info("Invoice email sent", { invoiceId, customerEmail });
      return { success: true };
    } catch (error) {
      logger.error("Error sending invoice email", error);
      throw new HttpsError("internal", "Failed to send email");
    }
  }
);

/* ---------------------------------
   48-HOUR HOLD RELEASE SCHEDULER
----------------------------------*/

// Scheduled function that runs every hour to release funds after 48-hour hold
export const releaseHeldFunds = onSchedule(
  {
    schedule: "every 1 hours", // Runs every hour
    timeZone: "Africa/Lagos",
    region,
  },
  async (event) => {
    try {
      const now = new Date();
      const transactionsRef = db.collection("walletTransactions");
      
      // Find transactions with pending_release status where holdReleaseAt has passed
      // Note: Firestore Timestamp comparison - we need to convert Date to Timestamp
      const { Timestamp } = await import("firebase-admin/firestore");
      const nowTimestamp = Timestamp.fromDate(now);
      
      const pendingReleaseQuery = transactionsRef
        .where("fundStatus", "==", "pending_release")
        .where("holdReleaseAt", "<=", nowTimestamp);

      const snapshot = await pendingReleaseQuery.get();
      let releasedCount = 0;

      for (const docSnap of snapshot.docs) {
        const transaction = docSnap.data();
        
        // Update transaction to credited
        await docSnap.ref.update({
          fundStatus: "credited",
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Update wallet balance (make funds available)
        const walletRef = db.collection("consultantWallets").doc(transaction.consultantUid);
        const walletDoc = await walletRef.get();

        if (walletDoc.exists) {
          // Add funds to balance now that they're credited
          await walletRef.update({
            balance: FieldValue.increment(transaction.amount),
            updatedAt: FieldValue.serverTimestamp(),
          });
          
          logger.info("Funds released", {
            consultantUid: transaction.consultantUid,
            amount: transaction.amount,
            invoiceId: transaction.invoiceId,
          });
        }

        releasedCount++;
      }

      logger.info("Hold release check completed", { releasedCount });
    } catch (error) {
      logger.error("Error releasing held funds", error);
      throw error;
    }
  }
);
