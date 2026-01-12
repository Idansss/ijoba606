import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { generateQuestionsWithOpenAI, generateQuestionsWithGemini, generateQuestionsFromTemplate } from "./generateQuestion";

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
  locationState: z.string().optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  specialties: z.array(z.string()).min(1).max(5),
  bio: z.string().min(20).max(1000),
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
  action: z.enum(["hide", "unhide", "lock", "unlock", "pin", "unpin", "accept_answer"]),
});

/* ---------------------------------
   CONSULTANT APPLICATION
----------------------------------*/
export const createConsultantApplication = onCall(
  { region },
  async (request) => {
  const uid = request.auth?.uid ?? null;

  const parsed = ConsultantApplicationSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid application data");
  }

  const data = parsed.data;

  await db.collection("consultantApplications").add({
    uid,
    ...data,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.info("Consultant application submitted", { email: data.email });

  return { success: true };
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

  const { targetKind, targetId, action } = parsed.data;

  // Determine collection
  const collection = targetKind === "thread" ? "forumThreads" : "forumPosts";
  const targetRef = db.collection(collection).doc(targetId);

  // Verify target exists
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    throw new HttpsError("not-found", `${targetKind} not found`);
  }

  // Perform action
  switch (action) {
    case "hide":
      await targetRef.update({
        isHidden: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      break;
    case "unhide":
      await targetRef.update({
        isHidden: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
      break;
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
  provider: z.enum(['openai', 'gemini', 'template']).default('openai'),
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
    } else {
      // Use template-based generation
      const templateResult = generateQuestionsFromTemplate({
        level: level as 1 | 2 | 3,
        topic,
        count,
      });
      questions = templateResult.questions;
    }

    // Save questions to Firestore
    const batch = db.batch();
    const questionIds: string[] = [];

    for (const question of questions) {
      const docRef = db.collection("questions").doc();
      batch.set(docRef, {
        ...question,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: uid,
        source: source,
      });
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
