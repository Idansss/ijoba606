import { RoundAnswer } from '@/lib/types';

/**
 * Calculate score for a round
 * +10 for correct answers
 * +2 per attempted question (once per question)
 */
export function calculateScore(answers: RoundAnswer[]): {
  correctCount: number;
  attemptCount: number;
  totalScore: number;
} {
  let correctCount = 0;
  let attemptCount = 0;

  for (const answer of answers) {
    if (answer.isCorrect) {
      correctCount++;
    }
    if (answer.attempted) {
      attemptCount++;
    }
  }

  const totalScore = correctCount * 10 + attemptCount * 2;

  return {
    correctCount,
    attemptCount,
    totalScore,
  };
}

/**
 * Check if arrays are equal (for multi-select answers)
 */
export function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

