export class DurableObject {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }
}

export class DurableObjectState {
  constructor() {
    this.storage = {
      sql: {
        exec(sql, ...params) {
          return {
            one: () => ({ id: 0, count: 0 }),
            toArray: () => [],
          };
        },
      },
    };
  }
  blockConcurrencyWhile(fn) {
    return fn();
  }
}
