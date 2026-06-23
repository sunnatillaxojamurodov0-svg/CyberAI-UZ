import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAiQuota, incrementAiUsage } from '@/lib/auth/ai-quota';

vi.mock('@/lib/db', () => ({
  requireDb: vi.fn(() => ({
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue({ count: 10 }),
    run: vi.fn().mockResolvedValue({}),
  })),
}));

vi.mock('@/lib/stripe', () => ({
  getUserSubscription: vi.fn().mockResolvedValue(null),
  getPlanLimits: vi.fn().mockReturnValue({ aiMessagesPerDay: 50, challengesPerDay: 3, maxHistory: 50 }),
}));

describe('AI Quota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check quota for authenticated user', async () => {
    const result = await checkAiQuota('user-123');
    expect(result).toHaveProperty('allowed');
    expect(result).toHaveProperty('remaining');
    expect(result).toHaveProperty('plan');
  });

  it('should check quota for anonymous user', async () => {
    const result = await checkAiQuota(null);
    expect(result).toHaveProperty('allowed');
    expect(result).toHaveProperty('remaining');
    expect(result.plan).toBe('free');
  });

  it('should increment usage', async () => {
    await expect(incrementAiUsage('user-123')).resolves.not.toThrow();
  });

  it('should increment usage for anonymous user', async () => {
    await expect(incrementAiUsage(null)).resolves.not.toThrow();
  });
});
