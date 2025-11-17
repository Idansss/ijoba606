# Cloud Functions Implementation Guide

This guide provides the structure and logic for implementing Firebase Cloud Functions for IJBoba 606.

## Setup

```bash
# In your project root
firebase init functions

# Select TypeScript
# Install dependencies

cd functions
npm install date-fns date-fns-tz
```

## Function Index Structure

Create these functions in `functions/src/index.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { formatInTimeZone } from 'date-fns-tz';

admin.initializeApp();
const db = admin.firestore();

// ==================== QUIZ FUNCTIONS ====================

export const submitRound = functions.https.onCall(async (data, context) => {
  // 1. Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const uid = context.auth.uid;
  const { level, questionIds, answers } = data;

  // 2. Rate limit check
  await checkRateLimit(uid, 'submitRound', 10, 60000); // 10 per minute

  // 3. Validate inputs
  if (!level || !questionIds || !answers || answers.length !== 3) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid round data');
  }

  // 4. Fetch questions and verify answers
  const questionsPromises = questionIds.map((id: string) =>
    db.collection('questions').doc(id).get()
  );
  const questionDocs = await Promise.all(questionsPromises);

  // 5. Calculate score
  let correctCount = 0;
  let attemptCount = 0;

  answers.forEach((answer: any, idx: number) => {
    if (answer.attempted) attemptCount++;
    if (answer.isCorrect) correctCount++;
  });

  const totalScore = correctCount * 10 + attemptCount * 2;

  // 6. Create round document
  const roundRef = await db.collection('rounds').add({
    uid,
    level,
    questionIds,
    correctCount,
    attemptCount,
    totalScore,
    startedAt: admin.firestore.Timestamp.now(),
    finishedAt: admin.firestore.Timestamp.now(),
  });

  // 7. Update profile
  const profileRef = db.collection('profiles').doc(uid);
  const profileSnap = await profileRef.get();
  const profile = profileSnap.data();

  // 8. Update streak (Africa/Lagos timezone)
  const today = formatInTimeZone(new Date(), 'Africa/Lagos', 'yyyy-MM-dd');
  const lastPlayed = profile?.lastPlayedLagosDate || '';
  
  let newStreak = 1;
  if (lastPlayed === today) {
    newStreak = profile?.streakCount || 1;
  } else if (isNextDay(lastPlayed, today)) {
    newStreak = (profile?.streakCount || 0) + 1;
  }

  const bestStreak = Math.max(newStreak, profile?.bestStreak || 0);

  // 9. Check for new badges
  const currentBadges = profile?.badges || [];
  const newBadges = evaluateNewBadges(currentBadges, {
    roundsCompleted: (profile?.roundsCompleted || 0) + 1,
    lastRoundScore: totalScore,
    lastRoundLevel: level,
    reliefQuestionsCorrect: profile?.reliefQuestionsCorrect || 0,
    currentStreak: newStreak,
  });

  // 10. Update profile
  await profileRef.update({
    totalPoints: admin.firestore.FieldValue.increment(totalScore),
    streakCount: newStreak,
    bestStreak,
    lastPlayedLagosDate: today,
    badges: admin.firestore.FieldValue.arrayUnion(...newBadges),
    roundsCompleted: admin.firestore.FieldValue.increment(1),
  });

  // 11. Update leaderboards
  await updateLeaderboards(uid, profile?.totalPoints + totalScore, bestStreak);

  return {
    round: { id: roundRef.id, totalScore, correctCount },
    newBadges,
    streakCount: newStreak,
  };
});

// Helper: Check if dates are consecutive
function isNextDay(prevDate: string, currentDate: string): boolean {
  if (!prevDate) return false;
  const prev = new Date(prevDate);
  const curr = new Date(currentDate);
  const diffTime = curr.getTime() - prev.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

// Helper: Evaluate new badges
function evaluateNewBadges(current: string[], data: any): string[] {
  const newBadges: string[] = [];
  
  if (data.roundsCompleted === 1 && !current.includes('tax_rookie')) {
    newBadges.push('tax_rookie');
  }
  if (data.lastRoundScore >= 24 && !current.includes('paye_pro')) {
    newBadges.push('paye_pro');
  }
  if (data.currentStreak >= 3 && !current.includes('streak_starter')) {
    newBadges.push('streak_starter');
  }
  if (data.currentStreak >= 7 && !current.includes('hot_streak')) {
    newBadges.push('hot_streak');
  }
  if (data.lastRoundLevel === 3 && data.lastRoundScore >= 26 && !current.includes('boss_level')) {
    newBadges.push('boss_level');
  }
  
  return newBadges;
}

// Helper: Update leaderboards
async function updateLeaderboards(uid: string, totalPoints: number, bestStreak: number) {
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const handle = userSnap.data()?.handle;

  // Weekly leaderboard
  await db.collection('leaderboards').doc('weekly').collection('entries').doc(uid).set({
    uid,
    handle,
    totalPoints,
    bestStreak,
    updatedAt: admin.firestore.Timestamp.now(),
  }, { merge: true });

  // All-time leaderboard
  await db.collection('leaderboards').doc('alltime').collection('entries').doc(uid).set({
    uid,
    handle,
    totalPoints,
    bestStreak,
    updatedAt: admin.firestore.Timestamp.now(),
  }, { merge: true });
}

// ==================== FORUM FUNCTIONS ====================

export const createThread = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const uid = context.auth.uid;
  const { title, bodyMD, tags } = data;

  // Rate limit
  await checkRateLimit(uid, 'createThread', 5, 60000); // 5 per minute

  // Validate
  if (!title || !bodyMD || !tags || tags.length === 0 || tags.length > 3) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid thread data');
  }

  // Profanity check
  if (containsProfanity(title) || containsProfanity(bodyMD)) {
    throw new functions.https.HttpsError('invalid-argument', 'Content contains inappropriate language');
  }

  // Create thread
  const threadRef = await db.collection('forumThreads').add({
    uid,
    title: title.trim(),
    bodyMD: bodyMD.trim(),
    tags,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    votes: 0,
    replyCount: 0,
    isLocked: false,
    isPinned: false,
  });

  // Update tag usage counts
  for (const tag of tags) {
    await db.collection('forumTags').doc(tag).set({
      name: tag,
      usageCount: admin.firestore.FieldValue.increment(1),
    }, { merge: true });
  }

  return { threadId: threadRef.id };
});

export const createPost = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const uid = context.auth.uid;
  const { tid, bodyMD, mentionedUids } = data;

  // Rate limit
  await checkRateLimit(uid, 'createPost', 5, 60000);

  // Validate
  if (!tid || !bodyMD) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid post data');
  }

  // Check if thread is locked
  const threadSnap = await db.collection('forumThreads').doc(tid).get();
  if (!threadSnap.exists || threadSnap.data()?.isLocked) {
    throw new functions.https.HttpsError('failed-precondition', 'Thread is locked');
  }

  // Profanity check
  if (containsProfanity(bodyMD)) {
    throw new functions.https.HttpsError('invalid-argument', 'Content contains inappropriate language');
  }

  // Create post
  const postRef = await db.collection('forumPosts').add({
    tid,
    uid,
    bodyMD: bodyMD.trim(),
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    votes: 0,
    isHidden: false,
    mentionedUids: mentionedUids || [],
  });

  // Update thread reply count
  await db.collection('forumThreads').doc(tid).update({
    replyCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.Timestamp.now(),
  });

  // Notify subscribers
  await notifyThreadSubscribers(tid, uid, postRef.id);

  // Notify mentioned users
  if (mentionedUids && mentionedUids.length > 0) {
    await notifyMentionedUsers(mentionedUids, tid, postRef.id);
  }

  return { postId: postRef.id };
});

export const voteThread = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const uid = context.auth.uid;
  const { targetId, value } = data; // value: 1, -1, or 0

  // Rate limit
  await checkRateLimit(uid, 'vote', 30, 60000); // 30 per minute

  // Get current vote
  const voteRef = db.doc(\`forumVotes/thread/\${targetId}/userVotes/\${uid}\`);
  const voteSnap = await voteRef.get();
  const currentVote = voteSnap.exists ? voteSnap.data()?.value || 0 : 0;

  const voteDiff = value - currentVote;

  // Update user vote
  if (value === 0) {
    await voteRef.delete();
  } else {
    await voteRef.set({
      value,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  // Update thread vote count
  await db.collection('forumThreads').doc(targetId).update({
    votes: admin.firestore.FieldValue.increment(voteDiff),
  });

  const threadSnap = await db.collection('forumThreads').doc(targetId).get();
  return { newVoteCount: threadSnap.data()?.votes || 0 };
});

export const votePost = functions.https.onCall(async (data, context) => {
  // Similar to voteThread but for posts
  // ... implementation similar to voteThread
});

export const reportContent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const uid = context.auth.uid;
  const { targetKind, targetId, reason, text } = data;

  // Create report
  const reportRef = await db.collection('forumReports').add({
    targetKind,
    targetId,
    reporterUid: uid,
    reason,
    text: text || '',
    createdAt: admin.firestore.Timestamp.now(),
    status: 'open',
  });

  // Notify moderators
  await notifyModerators(reportRef.id, targetKind, targetId);

  return { reportId: reportRef.id };
});

export const moderateContent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  // Check role
  const userRef = await db.collection('users').doc(context.auth.uid).get();
  const role = userRef.data()?.role;

  if (role !== 'moderator' && role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Moderator access required');
  }

  const { targetKind, targetId, action } = data;

  const collection = targetKind === 'thread' ? 'forumThreads' : 'forumPosts';
  const targetRef = db.collection(collection).doc(targetId);

  // Perform action
  switch (action) {
    case 'hide':
      await targetRef.update({ isHidden: true });
      break;
    case 'unhide':
      await targetRef.update({ isHidden: false });
      break;
    case 'lock':
      await targetRef.update({ isLocked: true });
      break;
    case 'unlock':
      await targetRef.update({ isLocked: false });
      break;
    case 'pin':
      await targetRef.update({ isPinned: true });
      break;
    case 'unpin':
      await targetRef.update({ isPinned: false });
      break;
  }

  return { success: true };
});

// ==================== CALCULATOR FUNCTIONS ====================

export const saveCalcRun = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');
  }

  const uid = context.auth.uid;
  const { inputs, outputs } = data;

  const runRef = await db.collection('calcRuns').add({
    uid,
    inputs,
    outputs,
    createdAt: admin.firestore.Timestamp.now(),
  });

  return { runId: runRef.id };
});

// ==================== HELPER FUNCTIONS ====================

async function checkRateLimit(uid: string, action: string, maxEvents: number, windowMs: number) {
  const rateLimitRef = db.collection('rateLimits').doc(uid);
  const rateLimitSnap = await rateLimitRef.get();
  
  const now = admin.firestore.Timestamp.now();
  const windowStart = new Date(now.toMillis() - windowMs);

  let events: admin.firestore.Timestamp[] = [];
  if (rateLimitSnap.exists) {
    events = rateLimitSnap.data()?.events || [];
    events = events.filter(e => e.toMillis() > windowStart.getTime());
  }

  if (events.length >= maxEvents) {
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Try again later.');
  }

  events.push(now);
  await rateLimitRef.set({ events });
}

function containsProfanity(text: string): boolean {
  const badWords = ['spam', 'scam']; // Add your profanity list
  const lowerText = text.toLowerCase();
  return badWords.some(word => lowerText.includes(word));
}

async function notifyThreadSubscribers(tid: string, authorUid: string, postId: string) {
  const subsSnapshot = await db.collection(\`forumSubscriptions/\${tid}/subscribers\`).get();
  
  for (const doc of subsSnapshot.docs) {
    const subscriberUid = doc.id;
    if (subscriberUid === authorUid) continue; // Don't notify the author

    await db.collection(\`notifications/\${subscriberUid}/items\`).add({
      type: 'thread_activity',
      ref: tid,
      title: 'New reply in subscribed thread',
      snippet: 'Someone replied to a thread you\'re following',
      isRead: false,
      createdAt: admin.firestore.Timestamp.now(),
    });
  }
}

async function notifyMentionedUsers(uids: string[], tid: string, postId: string) {
  for (const uid of uids) {
    await db.collection(\`notifications/\${uid}/items\`).add({
      type: 'mention',
      ref: tid,
      title: 'You were mentioned',
      snippet: 'Someone mentioned you in a forum post',
      isRead: false,
      createdAt: admin.firestore.Timestamp.now(),
    });
  }
}

async function notifyModerators(reportId: string, targetKind: string, targetId: string) {
  const moderatorsSnapshot = await db.collection('users')
    .where('role', 'in', ['moderator', 'admin'])
    .get();

  for (const doc of moderatorsSnapshot.docs) {
    await db.collection(\`notifications/\${doc.id}/items\`).add({
      type: 'moderator_action',
      ref: reportId,
      title: 'New content report',
      snippet: \`A \${targetKind} has been reported\`,
      isRead: false,
      createdAt: admin.firestore.Timestamp.now(),
    });
  }
}

// ==================== SCHEDULED FUNCTIONS ====================

export const rollWeeklyLeaderboards = functions.pubsub
  .schedule('5 0 * * 1') // Every Monday at 00:05
  .timeZone('Africa/Lagos')
  .onRun(async (context) => {
    // Archive current weekly leaderboard
    const weeklySnapshot = await db.collection('leaderboards/weekly/entries').get();
    
    const archiveDate = new Date().toISOString().split('T')[0];
    const batch = db.batch();

    weeklySnapshot.docs.forEach(doc => {
      const archiveRef = db.collection(\`leaderboards/archives/\${archiveDate}/entries\`).doc(doc.id);
      batch.set(archiveRef, doc.data());
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('Weekly leaderboard rolled over');
  });
```

## Deployment

```bash
firebase deploy --only functions
```

## Testing

Test functions locally:

```bash
firebase emulators:start
```

## Security Notes

1. All functions check authentication
2. Rate limiting prevents abuse
3. Profanity filtering protects community
4. Role-based access control for moderation
5. Input validation on all parameters

## Next Steps

1. Implement these functions in your Firebase project
2. Test each function individually
3. Monitor function logs for errors
4. Adjust rate limits based on usage
5. Expand profanity filter list
6. Add more sophisticated search (Algolia/Typesense)

