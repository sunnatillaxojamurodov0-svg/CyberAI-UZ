// DurableObject stub for local development

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

export class ConsoleSessionDO extends DurableObjectStub {
  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env);
  }

  async put(_key: string, _value: unknown): Promise<void> {}

  async get<T = unknown>(_key: string): Promise<T | null> {
    return null;
  }

  async delete(_key: string): Promise<void> {}

  async reset(): Promise<void> {}
}
