// @ts-nocheck
// DurableObject stub for local development

class DurableObjectStub {
  ctx: any;
  env: any;
  constructor(ctx: any, env: any) {
    this.ctx = ctx;
    this.env = env;
  }
}

interface StateEntry {
  key: string;
  value: string;
}

export class ConsoleSessionDO extends DurableObjectStub {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
  }

  async put(key: string, value: unknown): Promise<void> {}

  async get<T = unknown>(key: string): Promise<T | null> {
    return null;
  }

  async delete(key: string): Promise<void> {}

  async reset(): Promise<void> {}
}
