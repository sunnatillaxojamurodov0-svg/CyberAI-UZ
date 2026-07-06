import { describe, it, expect } from "vitest";
import { createEngineState, currentShell, promptString, execute } from "@/lib/console/engine";
import type { CTFChallenge } from "@/lib/console/types";

function makeChallenge(overrides?: Partial<CTFChallenge>): CTFChallenge {
  return {
    id: "test-engine",
    level: 1,
    category: "web",
    title: "Engine Test",
    summary: "Test challenge for engine",
    scenario: "Test scenario",
    objectives: ["Find the flag"],
    hints: ["Scan the target"],
    targetIp: "10.10.10.5",
    flag: "CYBERAI{test_flag}",
    flagFormat: "CYBERAI{...}",
    points: 100,
    rubric: {
      expectedTools: ["nmap", "curl"],
      expectedConcepts: ["port scanning"],
      parMinutes: 10,
    },
    env: {
      hosts: [
        {
          ip: "10.10.10.5",
          hostname: "web01.test",
          os: "Linux",
          ports: [
            { port: 22, service: "ssh", version: "OpenSSH 8.9", state: "open" },
            { port: 80, service: "http", version: "Apache 2.4", state: "open" },
          ],
          web: {
            server: "Apache/2.4",
            routes: {
              "/": { status: 200, body: "<h1>Hello World</h1>" },
              "/robots.txt": {
                status: 200,
                body: "User-agent: *\nDisallow: /secret/",
              },
              "/secret/": {
                status: 200,
                body: "Flag: CYBERAI{test_flag}",
              },
            },
            discoverablePaths: ["/", "/robots.txt", "/secret/"],
          },
          credentials: [{ service: "ssh", username: "admin", password: "pass123" }],
          fs: {
            "/home/admin/flag.txt": "CYBERAI{test_flag}",
          },
        },
      ],
      localFiles: {
        "/root/notes.txt": "Target: 10.10.10.5",
      },
    },
    ...overrides,
  };
}

describe("Console Engine", () => {
  describe("createEngineState", () => {
    it("should create initial state with local shell", () => {
      const challenge = makeChallenge();
      const state = createEngineState(challenge);
      expect(state.shells).toHaveLength(1);
      expect(state.shells[0].host).toBeNull();
      expect(state.shells[0].user).toBe("root");
      expect(state.shells[0].root).toBe(true);
      expect(state.shells[0].cwd).toBe("/root");
    });

    it("should initialize telemetry with empty values", () => {
      const challenge = makeChallenge();
      const state = createEngineState(challenge);
      expect(state.telemetry.challengeId).toBe("test-engine");
      expect(state.telemetry.toolsUsed).toEqual([]);
      expect(state.telemetry.commandCount).toBe(0);
      expect(state.telemetry.hintsUsed).toBe(0);
      expect(state.telemetry.solved).toBe(false);
      expect(state.telemetry.wrongAttempts).toBe(0);
    });

    it("should include local files in the filesystem", () => {
      const challenge = makeChallenge();
      const state = createEngineState(challenge);
      expect(state.localFs["/root/notes.txt"]).toBe("Target: 10.10.10.5");
      expect(state.localFs["/root/readme.txt"]).toContain("CyberAI Kali sandbox");
    });

    it("should initialize empty compromised set", () => {
      const challenge = makeChallenge();
      const state = createEngineState(challenge);
      expect(state.compromised.size).toBe(0);
    });
  });

  describe("currentShell", () => {
    it("should return the last shell in the stack", () => {
      const state = createEngineState(makeChallenge());
      const shell = currentShell(state);
      expect(shell).toBe(state.shells[state.shells.length - 1]);
    });
  });

  describe("promptString", () => {
    it("should show Kali prompt for local shell", () => {
      const state = createEngineState(makeChallenge());
      const prompt = promptString(state);
      expect(prompt).toContain("root㉿kali");
      expect(prompt).toContain("/root");
    });
  });

  describe("execute", () => {
    it("should return empty output for empty command", () => {
      const state = createEngineState(makeChallenge());
      const result = execute(state, "");
      expect(result.output).toBe("");
    });

    it("should return empty output for whitespace-only command", () => {
      const state = createEngineState(makeChallenge());
      const result = execute(state, "   ");
      expect(result.output).toBe("");
    });

    it("should increment commandCount on each command", () => {
      const state = createEngineState(makeChallenge());
      execute(state, "whoami");
      expect(state.telemetry.commandCount).toBe(1);
      execute(state, "pwd");
      expect(state.telemetry.commandCount).toBe(2);
    });

    it("should record tools used", () => {
      const state = createEngineState(makeChallenge());
      execute(state, "whoami");
      expect(state.telemetry.toolsUsed).toContain("whoami");
    });

    it("should not duplicate tool names", () => {
      const state = createEngineState(makeChallenge());
      execute(state, "whoami");
      execute(state, "whoami");
      const count = state.telemetry.toolsUsed.filter((t) => t === "whoami").length;
      expect(count).toBe(1);
    });

    describe("help", () => {
      it("should return help text", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "help");
        expect(result.output).toBeTruthy();
        expect(result.output.length).toBeGreaterThan(0);
      });
    });

    describe("whoami", () => {
      it("should return root for local shell", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "whoami");
        expect(result.output).toBe("root");
      });
    });

    describe("pwd", () => {
      it("should return /root for initial shell", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "pwd");
        expect(result.output).toBe("/root");
      });
    });

    describe("clear", () => {
      it("should return __CLEAR__ system command", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "clear");
        expect(result.output).toBe("__CLEAR__");
        expect(result.kind).toBe("system");
      });
    });

    describe("cat", () => {
      it("should read local files", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "cat /root/notes.txt");
        expect(result.output).toBe("Target: 10.10.10.5");
      });

      it("should return error for non-existent file", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "cat /nonexistent");
        expect(result.kind).toBe("error");
      });
    });

    describe("ls", () => {
      it("should list local files", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "ls");
        expect(result.output).toBeTruthy();
      });
    });

    describe("nmap", () => {
      it("should scan target and show ports", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "nmap 10.10.10.5");
        expect(result.output).toContain("22");
        expect(result.output).toContain("80");
        expect(result.output).toContain("open");
      });

      it("should report host as down for unknown target", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "nmap 10.10.10.99");
        expect(result.output).toContain("Host seems down");
      });
    });

    describe("curl", () => {
      it("should fetch web page content", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "curl http://10.10.10.5/");
        expect(result.output).toContain("Hello World");
      });

      it("should fetch robots.txt", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "curl http://10.10.10.5/robots.txt");
        expect(result.output).toContain("Disallow");
      });
    });

    describe("ping", () => {
      it("should ping a known host", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "ping 10.10.10.5");
        expect(result.output).toContain("10.10.10.5");
      });
    });

    describe("echo", () => {
      it("should echo arguments", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "echo hello world");
        expect(result.output).toContain("hello");
      });
    });

    describe("uname", () => {
      it("should return system info", () => {
        const state = createEngineState(makeChallenge());
        const result = execute(state, "uname -a");
        expect(result.output).toBeTruthy();
      });
    });
  });
});
