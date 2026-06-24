import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRTLCode, getLanguageConfig } from '@/lib/../hooks/useLanguage';

describe('Language Utils', () => {
  describe('isRTLCode', () => {
    it('should return true for Arabic', () => {
      expect(isRTLCode('ar')).toBe(true);
    });

    it('should return true for Farsi', () => {
      expect(isRTLCode('fa')).toBe(true);
    });

    it('should return true for Urdu', () => {
      expect(isRTLCode('ur')).toBe(true);
    });

    it('should return true for Hebrew', () => {
      expect(isRTLCode('he')).toBe(true);
    });

    it('should return false for English', () => {
      expect(isRTLCode('en')).toBe(false);
    });

    it('should return false for unknown language', () => {
      expect(isRTLCode('xx')).toBe(false);
    });
  });

  describe('getLanguageConfig', () => {
    it('should return config for English', () => {
      const config = getLanguageConfig('en');
      expect(config).toBeDefined();
      expect(config?.code).toBe('en');
      expect(config?.dir).toBe('ltr');
    });

    it('should return config for Arabic', () => {
      const config = getLanguageConfig('ar');
      expect(config).toBeDefined();
      expect(config?.code).toBe('ar');
      expect(config?.dir).toBe('rtl');
    });

    it('should return undefined for unknown language', () => {
      const config = getLanguageConfig('xx' as any);
      expect(config).toBeUndefined();
    });
  });
});
