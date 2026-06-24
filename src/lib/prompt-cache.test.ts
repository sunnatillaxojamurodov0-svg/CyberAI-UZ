import { describe, it, expect, vi } from 'vitest';
import { getCacheStats } from '@/lib/prompt-cache';

vi.mock('@/lib/db', () => ({
  getEnv: vi.fn(() => ({
    CYBERAI_KV: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    },
  })),
}));

describe('Prompt Cache', () => {
  describe('getCacheStats', () => {
    it('should return cache stats', async () => {
      const stats = await getCacheStats();
      expect(stats).toHaveProperty('enabled');
      expect(stats).toHaveProperty('ttl');
      expect(typeof stats.enabled).toBe('boolean');
      expect(typeof stats.ttl).toBe('number');
    });
  });
});
