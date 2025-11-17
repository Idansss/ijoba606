import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateStreak } from '../streak';
import * as dateUtils from '../date';

describe('Streak System', () => {
  beforeEach(() => {
    // Mock getCurrentLagosDate
    vi.spyOn(dateUtils, 'getCurrentLagosDate');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start streak at 1 for first time player', () => {
    vi.mocked(dateUtils.getCurrentLagosDate).mockReturnValue('2025-01-15');
    
    const result = updateStreak(null, 0);

    expect(result.newStreak).toBe(1);
    expect(result.today).toBe('2025-01-15');
  });

  it('should maintain streak if already played today', () => {
    vi.mocked(dateUtils.getCurrentLagosDate).mockReturnValue('2025-01-15');
    
    const result = updateStreak('2025-01-15', 5);

    expect(result.newStreak).toBe(5);
    expect(result.today).toBe('2025-01-15');
  });

  it('should increment streak if played consecutive days', () => {
    vi.mocked(dateUtils.getCurrentLagosDate).mockReturnValue('2025-01-16');
    
    const result = updateStreak('2025-01-15', 5);

    expect(result.newStreak).toBe(6);
    expect(result.today).toBe('2025-01-16');
  });

  it('should reset streak if skipped a day', () => {
    vi.mocked(dateUtils.getCurrentLagosDate).mockReturnValue('2025-01-17');
    
    const result = updateStreak('2025-01-15', 5);

    expect(result.newStreak).toBe(1);
    expect(result.today).toBe('2025-01-17');
  });

  it('should reset streak if many days passed', () => {
    vi.mocked(dateUtils.getCurrentLagosDate).mockReturnValue('2025-02-01');
    
    const result = updateStreak('2025-01-15', 10);

    expect(result.newStreak).toBe(1);
    expect(result.today).toBe('2025-02-01');
  });
});


