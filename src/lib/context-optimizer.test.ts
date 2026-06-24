import { describe, it, expect } from 'vitest';
import { optimizeContext, createOptimizedMessages, getContextStats } from '@/lib/context-optimizer';

describe('Context Optimizer', () => {
  const createMessage = (role: 'user' | 'assistant', content: string) => ({ role, content });

  describe('optimizeContext', () => {
    it('should return all messages if within token limit', () => {
      const history = [
        createMessage('user', 'Hello'),
        createMessage('assistant', 'Hi there'),
      ];
      const result = optimizeContext(history, 'How are you?');
      expect(result.length).toBe(2);
    });

    it('should truncate long messages to fit token limit', () => {
      const longMessage = 'a'.repeat(10000);
      const history = Array(100).fill(null).map((_, i) => 
        createMessage(i % 2 === 0 ? 'user' : 'assistant', longMessage)
      );
      const result = optimizeContext(history, 'Test', { maxTokens: 1000 });
      expect(result.length).toBeLessThan(history.length);
    });

    it('should prioritize recent messages', () => {
      const history = Array(50).fill(null).map((_, i) => 
        createMessage(i % 2 === 0 ? 'user' : 'assistant', `Message ${i}`)
      );
      const result = optimizeContext(history, 'Test');
      const lastMessage = result[result.length - 1];
      expect(lastMessage.content).toBe('Message 49');
    });
  });

  describe('createOptimizedMessages', () => {
    it('should include system prompt', () => {
      const history = [createMessage('user', 'Hello')];
      const result = createOptimizedMessages('System prompt', history, 'Test');
      expect(result[0].role).toBe('system');
      expect(result[0].content).toBe('System prompt');
    });

    it('should include current message', () => {
      const history = [createMessage('user', 'Hello')];
      const result = createOptimizedMessages(undefined, history, 'Current message');
      expect(result[result.length - 1].content).toBe('Current message');
    });

    it('should work without system prompt', () => {
      const history = [createMessage('user', 'Hello')];
      const result = createOptimizedMessages(undefined, history, 'Test');
      expect(result[0].role).not.toBe('system');
    });
  });

  describe('getContextStats', () => {
    it('should return correct stats', () => {
      const history = [
        createMessage('user', 'Hello'),
        createMessage('assistant', 'Hi'),
      ];
      const stats = getContextStats(history, 'Test');
      expect(stats.totalMessages).toBe(2);
      expect(stats.selectedMessages).toBeGreaterThan(0);
      expect(stats.estimatedTokens).toBeGreaterThan(0);
      expect(stats.utilization).toBeGreaterThanOrEqual(0);
      expect(stats.utilization).toBeLessThanOrEqual(100);
    });
  });
});
