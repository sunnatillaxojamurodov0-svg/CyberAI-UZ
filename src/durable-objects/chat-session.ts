// DurableObject stub for local development
// In Cloudflare Workers, this class is replaced by the real DurableObject

export interface ChatMessage {
  id: number;
  role: "user" | "model";
  content: string;
  image?: string;
  created_at: number;
}

interface DurableObjectState {
  storage: unknown;
}

class DurableObjectStub {
  ctx: DurableObjectState;
  env: Record<string, unknown>;
  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    this.ctx = ctx;
    this.env = env;
  }
}

export class ChatSessionDO extends DurableObjectStub {
  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env);
  }

  async addMessage(_role: "user" | "model", _content: string, _image?: string): Promise<number> {
    return Date.now();
  }

  async getHistory(_limit = 50): Promise<ChatMessage[]> {
    return [];
  }

  async clearHistory(): Promise<void> {}

  async count(): Promise<number> {
    return 0;
  }
}
