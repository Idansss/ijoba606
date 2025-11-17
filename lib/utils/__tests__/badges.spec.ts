import { describe, it, expect } from 'vitest';
import { evaluateNewBadges, BADGES } from '../badges';

describe('Badge System', () => {
  it('should award Tax Rookie for first round', () => {
    const newBadges = evaluateNewBadges([], {
      roundsCompleted: 1,
      lastRoundScore: 15,
      lastRoundLevel: 1,
      reliefQuestionsCorrect: 0,
      currentStreak: 1,
    });

    expect(newBadges).toContain('tax_rookie');
  });

  it('should not award Tax Rookie twice', () => {
    const newBadges = evaluateNewBadges(['tax_rookie'], {
      roundsCompleted: 2,
      lastRoundScore: 15,
      lastRoundLevel: 1,
      reliefQuestionsCorrect: 0,
      currentStreak: 1,
    });

    expect(newBadges).not.toContain('tax_rookie');
  });

  it('should award PAYE Pro for 24+ score', () => {
    const newBadges = evaluateNewBadges([], {
      roundsCompleted: 5,
      lastRoundScore: 24,
      lastRoundLevel: 1,
      reliefQuestionsCorrect: 0,
      currentStreak: 1,
    });

    expect(newBadges).toContain('paye_pro');
  });

  it('should award Relief Ranger for 3 relief questions', () => {
    const newBadges = evaluateNewBadges([], {
      roundsCompleted: 5,
      lastRoundScore: 15,
      lastRoundLevel: 1,
      reliefQuestionsCorrect: 3,
      currentStreak: 1,
    });

    expect(newBadges).toContain('relief_ranger');
  });

  it('should award Streak Starter for 3-day streak', () => {
    const newBadges = evaluateNewBadges([], {
      roundsCompleted: 5,
      lastRoundScore: 15,
      lastRoundLevel: 1,
      reliefQuestionsCorrect: 0,
      currentStreak: 3,
    });

    expect(newBadges).toContain('streak_starter');
  });

  it('should award Hot Streak for 7-day streak', () => {
    const newBadges = evaluateNewBadges([], {
      roundsCompleted: 10,
      lastRoundScore: 15,
      lastRoundLevel: 1,
      reliefQuestionsCorrect: 0,
      currentStreak: 7,
    });

    expect(newBadges).toContain('hot_streak');
  });

  it('should award Boss Level for L3 with 26+ score', () => {
    const newBadges = evaluateNewBadges([], {
      roundsCompleted: 20,
      lastRoundScore: 26,
      lastRoundLevel: 3,
      reliefQuestionsCorrect: 0,
      currentStreak: 1,
    });

    expect(newBadges).toContain('boss_level');
  });

  it('should not award Boss Level for L2 even with 26+ score', () => {
    const newBadges = evaluateNewBadges([], {
      roundsCompleted: 15,
      lastRoundScore: 28,
      lastRoundLevel: 2,
      reliefQuestionsCorrect: 0,
      currentStreak: 1,
    });

    expect(newBadges).not.toContain('boss_level');
  });

  it('should award multiple badges at once', () => {
    const newBadges = evaluateNewBadges([], {
      roundsCompleted: 1,
      lastRoundScore: 26,
      lastRoundLevel: 3,
      reliefQuestionsCorrect: 3,
      currentStreak: 7,
    });

    expect(newBadges).toContain('tax_rookie');
    expect(newBadges).toContain('paye_pro');
    expect(newBadges).toContain('relief_ranger');
    expect(newBadges).toContain('streak_starter');
    expect(newBadges).toContain('hot_streak');
    expect(newBadges).toContain('boss_level');
  });

  it('should have all badge definitions', () => {
    expect(BADGES.tax_rookie).toBeDefined();
    expect(BADGES.paye_pro).toBeDefined();
    expect(BADGES.relief_ranger).toBeDefined();
    expect(BADGES.streak_starter).toBeDefined();
    expect(BADGES.hot_streak).toBeDefined();
    expect(BADGES.boss_level).toBeDefined();
  });
});


