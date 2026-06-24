/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// Cloudflare Workflows - runtime types provided by Cloudflare
// This file uses @ts-nocheck because cloudflare:workflows types are only available at runtime

type WorkflowStepContext = {
  step: { name: string; count: number };
  attempt: number;
};

type WorkflowStep = {
  do<T>(name: string, fn: () => Promise<T>): Promise<T>;
  do<T>(
    name: string,
    config: {
      retries?: { limit: number; delay: string | number; backoff: string };
      timeout?: string;
    },
    fn: () => Promise<T>,
  ): Promise<T>;
  sleep(name: string, duration: string | number): Promise<void>;
  sleepUntil(name: string, timestamp: number): Promise<void>;
  waitForEvent<T>(name: string, opts: { type: string; timeout?: string }): Promise<T>;
};

type WorkflowEvent<T> = {
  payload: T;
  instanceId: string;
  timestamp: number;
};

type Workflow = {
  create(opts: { id: string; params: Record<string, unknown> }): Promise<{ id: string }>;
  get(
    id: string,
  ): Promise<{ status(): Promise<{ status: string; output?: unknown; error?: string }> }>;
};

type WorkflowEntrypointClass<Env, Params> = {
  new (): {
    env: Env;
    run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<unknown>;
  };
};

class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableError";
  }
}

type Env = {
  cyberai_db: {
    prepare(sql: string): {
      bind(...args: unknown[]): { first<T>(): Promise<T | null>; run(): Promise<unknown> };
    };
  };
  CYBERAI_KV: {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  };
  AI: unknown;
  MY_BUCKET: unknown;
  CHALLENGE_WORKFLOW: Workflow;
  ONBOARDING_WORKFLOW: Workflow;
  CONSOLE_WORKFLOW: Workflow;
};

type ChallengeParams = {
  userId: string;
  difficulty: number;
  category: string;
};

type OnboardingParams = {
  userId: string;
  email: string;
  name: string;
};

type ConsoleParams = {
  sessionId: string;
  userId: string;
  challengeId: string;
  commandHistory: string[];
};

class ChallengeGenerator {
  env!: Env;

  async run(event: WorkflowEvent<ChallengeParams>, step: WorkflowStep) {
    const { userId, difficulty, category } = event.payload;

    const challenge = await step.do(
      "generate challenge",
      {
        retries: { limit: 3, delay: "5 seconds", backoff: "exponential" },
      },
      async () => {
        const categories = ["web", "crypto", "forensics", "reverse", "pwn", "misc"];
        const topics: Record<string, string[]> = {
          web: ["SQL injection", "XSS", "CSRF", "SSRF", "IDOR", "authentication bypass"],
          crypto: ["RSA", "AES", "hash collision", "key exchange", "padding oracle"],
          forensics: ["memory dump", "packet capture", "file carving", "steganography"],
          reverse: ["binary analysis", "deobfuscation", "anti-debug", "API hooking"],
          pwn: ["buffer overflow", "format string", "heap exploitation", "ROP chains"],
          misc: ["steganography", "encoding", "blockchain", "OSINT"],
        };

        const selectedCategory = categories.includes(category)
          ? category
          : categories[Math.floor(Math.random() * categories.length)];
        const availableTopics = topics[selectedCategory] || topics.misc;
        const topic = availableTopics[Math.floor(Math.random() * availableTopics.length)];

        const difficultyNames: Record<number, string> = {
          1: "Easy",
          2: "Medium",
          3: "Hard",
          4: "Expert",
          5: "Insane",
        };
        const diffLevel = Math.max(1, Math.min(5, difficulty));

        const id = crypto.randomUUID();
        const flag = `CTF{${crypto.randomUUID().split("-")[0]}}`;

        const scenarios: Record<string, string> = {
          web: `A web application at target.cyberai.local has a ${topic} vulnerability in its login form. Enumerate the application, identify the vulnerability, and exploit it to retrieve the hidden flag.`,
          crypto: `You intercepted an encrypted message using ${topic}. The encrypted data is available in /tmp/encrypted.bin. Analyze the encryption method and recover the plaintext flag.`,
          forensics: `A suspicious file was found on a compromised server at /var/log/suspicious.pcap. Analyze the ${topic} evidence to uncover the hidden flag.`,
          reverse: `A malware sample was captured at /tmp/sample.exe. It uses ${topic} techniques to protect its payload. Reverse engineer the binary to extract the flag.`,
          pwn: `A vulnerable service is running on port 1337. It has a ${topic} vulnerability. Exploit it to gain access and read the flag from /root/flag.txt.`,
          misc: `An encoded message was found using ${topic} techniques. Decode it to reveal the flag.`,
        };

        return {
          id,
          name: `${selectedCategory.toUpperCase()}: ${topic}`,
          difficulty: diffLevel,
          difficultyName: difficultyNames[diffLevel],
          category: selectedCategory,
          scenario: scenarios[selectedCategory] || scenarios.misc,
          objectives: JSON.stringify([
            `Enumerate the target and identify the attack surface`,
            `Develop an exploit for the ${topic} vulnerability`,
            `Retrieve the flag from the target`,
          ]),
          flag,
          created_at: Math.floor(Date.now() / 1000),
        };
      },
    );

    await step.do(
      "save challenge to database",
      {
        retries: { limit: 3, delay: "2 seconds", backoff: "linear" },
      },
      async () => {
        await this.env.cyberai_db
          .prepare(
            "INSERT INTO challenges (id, name, difficulty, category, scenario, objectives, flag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .bind(
            challenge.id,
            challenge.name,
            challenge.difficulty,
            challenge.category,
            challenge.scenario,
            challenge.objectives,
            challenge.flag,
            challenge.created_at,
          )
          .run();
      },
    );

    await step.do(
      "assign challenge to user",
      {
        retries: { limit: 2, delay: "1 second", backoff: "constant" },
      },
      async () => {
        await this.env.cyberai_db
          .prepare(
            "INSERT INTO user_challenges (user_id, challenge_id, assigned_at, status) VALUES (?, ?, ?, ?)",
          )
          .bind(userId, challenge.id, Math.floor(Date.now() / 1000), "pending")
          .run();
      },
    );

    await step.do("create notification", async () => {
      await this.env.cyberai_db
        .prepare(
          "INSERT INTO notifications (user_id, type, title, body, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(
          userId,
          "challenge",
          "New Challenge Assigned",
          `You have been assigned: ${challenge.name} (${challenge.difficultyName})`,
          Math.floor(Date.now() / 1000),
        )
        .run();
    });

    await step.do("cache challenge in KV", async () => {
      await this.env.CYBERAI_KV.put(`challenge:${challenge.id}`, JSON.stringify(challenge), {
        expirationTtl: 86400,
      });
    });

    return {
      challengeId: challenge.id,
      name: challenge.name,
      difficulty: challenge.difficulty,
      difficultyName: challenge.difficultyName,
      category: challenge.category,
    };
  }
}

class UserOnboarding {
  env!: Env;

  async run(event: WorkflowEvent<OnboardingParams>, step: WorkflowStep) {
    const { userId, email, name } = event.payload;

    await step.do(
      "verify user exists",
      {
        retries: { limit: 2, delay: "2 seconds", backoff: "linear" },
      },
      async () => {
        const user = await this.env.cyberai_db
          .prepare("SELECT id FROM users WHERE id = ?")
          .bind(userId)
          .first();
        if (!user) throw new NonRetryableError(`User ${userId} not found`);
      },
    );

    await step.do("create welcome notification", async () => {
      await this.env.cyberai_db
        .prepare(
          "INSERT INTO notifications (user_id, type, title, body, created_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(
          userId,
          "info",
          "Welcome to CyberAI!",
          `Welcome ${name || email}! Start exploring CTF challenges and sharpen your cybersecurity skills.`,
          Math.floor(Date.now() / 1000),
        )
        .run();
    });

    await step.do(
      "generate starter challenge",
      {
        retries: { limit: 2, delay: "3 seconds", backoff: "exponential" },
      },
      async () => {
        await this.env.CHALLENGE_WORKFLOW.create({
          id: `starter-${userId}`,
          params: { userId, difficulty: 1, category: "web" },
        });
      },
    );

    await step.do("initialize user stats", async () => {
      await this.env.CYBERAI_KV.put(
        `stats:${userId}`,
        JSON.stringify({
          challenges_completed: 0,
          total_score: 0,
          streak: 0,
          joined_at: new Date().toISOString(),
        }),
        { expirationTtl: 2592000 },
      );
    });

    return { completed: true, userId };
  }
}

class ConsoleAnalysis {
  env!: Env;

  async run(event: WorkflowEvent<ConsoleParams>, step: WorkflowStep) {
    const { sessionId, userId, challengeId, commandHistory } = event.payload;

    await step.do(
      "validate session",
      {
        retries: { limit: 2, delay: "1 second", backoff: "constant" },
      },
      async () => {
        const session = await this.env.cyberai_db
          .prepare("SELECT id FROM console_sessions WHERE id = ? AND user_id = ?")
          .bind(sessionId, userId)
          .first();
        if (!session)
          throw new NonRetryableError(`Session ${sessionId} not found for user ${userId}`);
      },
    );

    const analysis = await step.do(
      "analyze command history",
      {
        retries: { limit: 2, delay: "5 seconds", backoff: "exponential" },
      },
      async () => {
        const commands = commandHistory;
        const toolUsage: Record<string, number> = {};
        const attackPatterns: string[] = [];

        for (const cmd of commands) {
          const parts = cmd.split(" ");
          const tool = parts[0]?.toLowerCase();
          if (tool) {
            toolUsage[tool] = (toolUsage[tool] || 0) + 1;
          }

          if (cmd.includes("nmap") || cmd.includes("masscan"))
            attackPatterns.push("reconnaissance");
          if (cmd.includes("sqlmap") || cmd.includes("sqli")) attackPatterns.push("sql_injection");
          if (cmd.includes("hydra") || cmd.includes("john")) attackPatterns.push("brute_force");
          if (cmd.includes("metasploit") || cmd.includes("msfconsole"))
            attackPatterns.push("exploitation");
          if (cmd.includes("gobuster") || cmd.includes("dirb") || cmd.includes("feroxbuster"))
            attackPatterns.push("directory_enumeration");
          if (cmd.includes("curl") && cmd.includes("POST")) attackPatterns.push("api_testing");
        }

        const methodology = {
          recon: commands.some((c: string) => c.includes("nmap") || c.includes("enum")),
          enumeration: commands.some(
            (c: string) => c.includes("gobuster") || c.includes("dirb") || c.includes("nikto"),
          ),
          exploitation: commands.some(
            (c: string) => c.includes("sqlmap") || c.includes("exploit") || c.includes("msf"),
          ),
          post_exploitation: commands.some(
            (c: string) => c.includes("ssh") || c.includes("scp") || c.includes("upload"),
          ),
        };

        const score = Object.values(methodology).filter(Boolean).length * 25;

        return {
          total_commands: commands.length,
          tool_usage: toolUsage,
          attack_patterns: [...new Set(attackPatterns)],
          methodology_coverage: methodology,
          score,
          analyzed_at: Math.floor(Date.now() / 1000),
        };
      },
    );

    await step.do(
      "save analysis to database",
      {
        retries: { limit: 2, delay: "2 seconds", backoff: "linear" },
      },
      async () => {
        await this.env.cyberai_db
          .prepare("UPDATE console_sessions SET analysis = ?, completed_at = ? WHERE id = ?")
          .bind(JSON.stringify(analysis), Math.floor(Date.now() / 1000), sessionId)
          .run();
      },
    );

    if (analysis.score >= 75) {
      await step.do(
        "update leaderboard",
        {
          retries: { limit: 2, delay: "1 second", backoff: "constant" },
        },
        async () => {
          const existing = await this.env.cyberai_db
            .prepare("SELECT id FROM leaderboard WHERE user_id = ? AND challenge_id = ?")
            .bind(userId, challengeId)
            .first();

          if (!existing) {
            await this.env.cyberai_db
              .prepare(
                "INSERT INTO leaderboard (user_id, challenge_id, score, time_seconds, tools_used, solved_at) VALUES (?, ?, ?, ?, ?, ?)",
              )
              .bind(
                userId,
                challengeId,
                analysis.score,
                0,
                JSON.stringify(Object.keys(analysis.tool_usage)),
                Math.floor(Date.now() / 1000),
              )
              .run();
          }
        },
      );

      await step.do(
        "update challenge status",
        {
          retries: { limit: 2, delay: "1 second", backoff: "constant" },
        },
        async () => {
          await this.env.cyberai_db
            .prepare(
              "UPDATE user_challenges SET status = ?, completed_at = ? WHERE user_id = ? AND challenge_id = ?",
            )
            .bind("completed", Math.floor(Date.now() / 1000), userId, challengeId)
            .run();
        },
      );
    }

    return { sessionId, analysis };
  }
}

export { ChallengeGenerator, UserOnboarding, ConsoleAnalysis, NonRetryableError };
export type { Env, ChallengeParams, OnboardingParams, ConsoleParams };
