import { describe, it, expect } from 'vitest';
import { calculateScore, arraysEqual } from '../scoring';
import { RoundAnswer } from '@/lib/types';

describe('Scoring System', () => {
  it('should calculate score with all correct answers', () => {
    const answers: RoundAnswer[] = [
      { questionId: 'q1', selectedOptions: [0], isCorrect: true, attempted: true },
      { questionId: 'q2', selectedOptions: [1], isCorrect: true, attempted: true },
      { questionId: 'q3', selectedOptions: [2], isCorrect: true, attempted: true },
    ];

    const result = calculateScore(answers);

    expect(result.correctCount).toBe(3);
    expect(result.attemptCount).toBe(3);
    expect(result.totalScore).toBe(36); // 3 * 10 + 3 * 2
  });

  it('should calculate score with some wrong answers', () => {
    const answers: RoundAnswer[] = [
      { questionId: 'q1', selectedOptions: [0], isCorrect: true, attempted: true },
      { questionId: 'q2', selectedOptions: [1], isCorrect: false, attempted: true },
      { questionId: 'q3', selectedOptions: [2], isCorrect: true, attempted: true },
    ];

    const result = calculateScore(answers);

    expect(result.correctCount).toBe(2);
    expect(result.attemptCount).toBe(3);
    expect(result.totalScore).toBe(26); // 2 * 10 + 3 * 2
  });

  it('should calculate score with unattempted questions', () => {
    const answers: RoundAnswer[] = [
      { questionId: 'q1', selectedOptions: [0], isCorrect: true, attempted: true },
      { questionId: 'q2', selectedOptions: [], isCorrect: false, attempted: false },
      { questionId: 'q3', selectedOptions: [2], isCorrect: false, attempted: true },
    ];

    const result = calculateScore(answers);

    expect(result.correctCount).toBe(1);
    expect(result.attemptCount).toBe(2);
    expect(result.totalScore).toBe(14); // 1 * 10 + 2 * 2
  });

  it('should give minimum 2 points for attempting', () => {
    const answers: RoundAnswer[] = [
      { questionId: 'q1', selectedOptions: [0], isCorrect: false, attempted: true },
      { questionId: 'q2', selectedOptions: [1], isCorrect: false, attempted: true },
      { questionId: 'q3', selectedOptions: [2], isCorrect: false, attempted: true },
    ];

    const result = calculateScore(answers);

    expect(result.correctCount).toBe(0);
    expect(result.attemptCount).toBe(3);
    expect(result.totalScore).toBe(6); // 0 * 10 + 3 * 2
  });
});

describe('Arrays Equal', () => {
  it('should return true for equal arrays', () => {
    expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(arraysEqual([3, 2, 1], [1, 2, 3])).toBe(true); // Order doesn't matter
  });

  it('should return false for different arrays', () => {
    expect(arraysEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(arraysEqual([1, 2, 3], [1, 2, 4])).toBe(false);
  });

  it('should handle empty arrays', () => {
    expect(arraysEqual([], [])).toBe(true);
    expect(arraysEqual([1], [])).toBe(false);
  });
});


