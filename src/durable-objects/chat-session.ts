// @ts-nocheck
// DurableObject stub for local development
// In Cloudflare Workers, this class is replaced by the real DurableObject

export interface ChatMessage {
  id: number;
  role: "user" | "model";
  content: string;
  image?: string;
  created_at: number;
}

class DurableObjectStub {
  ctx: any;
  env: any;
  constructor(ctx: any, env: any) {
    this.ctx = ctx;
    this.env = env;
  }
}

export class ChatSessionDO extends DurableObjectStub {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
  }

  async addMessage(role: "user" | "model", content: string, image?: string): Promise<number> {
    return Date.now();
  }

  async getHistory(limit = 50): Promise<ChatMessage[]> {
    return [];
  }

  async clearHistory(): Promise<void> {}

  async count(): Promise<number> {
    return 0;
  }
}
