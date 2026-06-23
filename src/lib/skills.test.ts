import { describe, it, expect } from 'vitest';
import { SKILLS } from '@/lib/skills';

describe('Skills', () => {
  it('should export skills array', () => {
    expect(Array.isArray(SKILLS)).toBe(true);
    expect(SKILLS.length).toBeGreaterThan(0);
  });

  it('should have valid skill structure', () => {
    for (const skill of SKILLS) {
      expect(skill).toHaveProperty('id');
      expect(skill).toHaveProperty('label');
      expect(skill).toHaveProperty('description');
      expect(skill).toHaveProperty('promptPrefix');
      expect(typeof skill.id).toBe('string');
      expect(typeof skill.label).toBe('string');
      expect(typeof skill.description).toBe('string');
      expect(typeof skill.promptPrefix).toBe('string');
    }
  });

  it('should have unique ids', () => {
    const ids = SKILLS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
