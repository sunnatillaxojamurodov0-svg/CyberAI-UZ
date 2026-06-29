import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { createEngineState, execute, promptString, type EngineState } from "@/lib/console/engine";
import type { CTFChallenge, TerminalLine } from "@/lib/console/types";

const AVAILABLE_COMMANDS = [
  "nmap",
  "ping",
  "ip",
  "ifconfig",
  "curl",
  "wget",
  "gobuster",
  "dirb",
  "ffuf",
  "nc",
  "ncat",
  "smbclient",
  "enum4linux",
  "ssh",
  "ftp",
  "hydra",
  "evil-winrm",
  "mysql",
  "docker",
  "sudo",
  "find",
  "searchsploit",
  "uname",
  "base64",
  "tr",
  "rot13",
  "echo",
  "hashid",
  "john",
  "hashcat",
  "zip2john",
  "unzip",
  "strings",
  "steghide",
  "binwalk",
  "exiftool",
  "ls",
  "cd",
  "pwd",
  "cat",
  "chmod",
  "whoami",
  "id",
  "clear",
  "exit",
  "ask-ai",
  "hint",
  "help",
  "cat_flag",
];

export interface TerminalHandle {
  getState: () => EngineState;
  reset: () => void;
  run: (cmd: string) => void;
}

interface TerminalProps {
  challenge: CTFChallenge;
  theme?: "dark" | "light";
}

const BANNER = (c: CTFChallenge) =>
  `┌─────────────────────────────────────────────────────────────┐
│  CyberAI Kali Sandbox  ·  fully isolated environment       │
│  No external network — only CTF targets available.            │
└─────────────────────────────────────────────────────────────┘

[*] Challenge : ${c.title}  (Level ${c.level})
[*] Target    : ${c.targetIp}
[*] Format    : ${c.flagFormat}

Type 'help' for tools, 'ask-ai <question>' for guidance.
`;

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal(
  { challenge, theme = "dark" },
  ref,
) {
  const [engine, setEngine] = useState<EngineState>(() => createEngineState(challenge));
  const engineRef = useRef(engine);
  engineRef.current = engine;

  const lineIdCounter = useRef(0);
  const getLineId = () => `ln_${++lineIdCounter.current}`;

  const [lines, setLines] = useState<TerminalLine[]>(() => [
    { id: getLineId(), kind: "system", text: BANNER(challenge) },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiStreamText, setAiStreamText] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiLineId = useRef<string | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, aiStreamText]);

  /* Re-init when challenge changes */
  useEffect(() => {
    const fresh = createEngineState(challenge);
    setEngine(fresh);
    engineRef.current = fresh;
    lineIdCounter.current = 0;
    setLines([{ id: getLineId(), kind: "system", text: BANNER(challenge) }]);
    setHistory([]);
    setHistIdx(-1);
    setAiStreaming(false);
    setAiStreamText("");
    aiLineId.current = null;
  }, [challenge]);

  const fetchAiHint = useCallback(
    async (userMessage: string, state: EngineState) => {
      const lineId = getLineId();
      aiLineId.current = lineId;
      setAiStreaming(true);
      setAiStreamText("");

      setLines((prev) => [...prev, { id: lineId, kind: "ai-hint", text: "" }]);

      try {
        const res = await fetch("/api/console/hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            challengeId: challenge.id,
            challengeTitle: challenge.title,
            challengeLevel: challenge.level,
            challengeCategory: challenge.category,
            scenario: challenge.scenario,
            objectives: challenge.objectives,
            targetIp: challenge.targetIp,
            commandHistory: history.slice(-30),
            toolsUsed: state.telemetry.toolsUsed,
            userMessage,
          }),
        });

        if (!res.ok) {
          const errText =
            res.status === 401 ? "AI requires authentication." : "AI service unavailable.";
          setLines((prev) => prev.map((m) => (m.id === lineId ? { ...m, text: errText } : m)));
          setAiStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setLines((prev) =>
            prev.map((m) => (m.id === lineId ? { ...m, text: "AI: no response stream." } : m)),
          );
          setAiStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setAiStreamText(acc);
        }

        setLines((prev) =>
          prev.map((m) => (m.id === lineId ? { ...m, text: acc || "AI: (empty response)" } : m)),
        );
      } catch {
        setLines((prev) =>
          prev.map((m) =>
            m.id === lineId ? { ...m, text: "Network error — AI unavailable." } : m,
          ),
        );
      } finally {
        setAiStreaming(false);
        aiLineId.current = null;
      }
    },
    [challenge, history],
  );

  const runCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      // Handle ask-ai command
      if (trimmed.toLowerCase().startsWith("ask-ai ")) {
        const userMessage = trimmed.slice(7).trim();
        if (userMessage) {
          setLines((prev) => [
            ...prev,
            {
              id: getLineId(),
              kind: "input",
              text: `${promptString(engineRef.current)} ${trimmed}`,
            },
          ]);
          fetchAiHint(userMessage, engineRef.current);
        }
        return;
      }

      const result = execute(engineRef.current, trimmed);

      if (result.output === "__CLEAR__") {
        setLines([]);
        setInput("");
        setHistory((prev) => [...prev, trimmed]);
        setHistIdx(-1);
        return;
      }

      setLines((prev) => [
        ...prev,
        { id: getLineId(), kind: "input", text: `${promptString(engineRef.current)} ${trimmed}` },
        { id: getLineId(), kind: result.kind, text: result.output },
      ]);

      setInput("");
      setHistory((prev) => [...prev, trimmed]);
      setHistIdx(-1);
    },
    [fetchAiHint],
  );

  const handleSubmit = useCallback(() => {
    runCommand(input);
    setInput("");
  }, [input, runCommand]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length === 0) return;
        const next = histIdx + 1;
        if (next >= history.length) return;
        setHistIdx(next);
        setInput(history[history.length - 1 - next] ?? "");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = histIdx - 1;
        if (next >= history.length) {
          setHistIdx(-1);
          setInput("");
        } else {
          setHistIdx(next);
          setInput(history[next] ?? "");
        }
        return;
      }
      if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        setLines([]);
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const trimmed = input.trimStart();
        const parts = trimmed.split(/\s+/);
        const partial = parts[parts.length - 1];
        if (partial) {
          const matches = AVAILABLE_COMMANDS.filter((cmd) => cmd.startsWith(partial));
          if (matches.length === 1) {
            parts[parts.length - 1] = matches[0];
            setInput(parts.join(" "));
          } else if (matches.length > 1) {
            setLines((prev) => [
              ...prev,
              { id: getLineId(), kind: "system", text: matches.join("  ") },
            ]);
          }
        }
      }
    },
    [history, histIdx, handleSubmit],
  );

  useImperativeHandle(ref, () => ({
    getState: () => engineRef.current,
    reset: () => {
      const fresh = createEngineState(challenge);
      setEngine(fresh);
      engineRef.current = fresh;
      setLines([{ id: getLineId(), kind: "system", text: BANNER(challenge) }]);
      setHistory([]);
      setHistIdx(-1);
      setAiStreaming(false);
      setAiStreamText("");
      aiLineId.current = null;
    },
    run: (cmd: string) => runCommand(cmd),
  }));

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-xl border overflow-hidden font-mono text-[13px] md:text-[13px] text-[12px]",
        theme === "dark" ? "border-border bg-[#0a0e17]" : "border-gray-300 bg-[#f8f9fa]",
      )}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 scrollbar-thin"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line) => {
          if (line.id === aiLineId.current && aiStreamText) {
            return (
              <div key={line.id} className="mb-1">
                <span
                  className={cn(
                    "whitespace-pre-wrap break-all",
                    theme === "dark" ? "text-emerald-400" : "text-emerald-600",
                  )}
                >
                  {aiStreamText}
                </span>
                {aiStreaming && (
                  <span
                    className={cn(
                      "inline-block w-2 h-4 ml-0.5 animate-blink align-text-bottom",
                      theme === "dark" ? "bg-emerald-400/70" : "bg-emerald-600/70",
                    )}
                  />
                )}
              </div>
            );
          }
          return (
            <div key={line.id} className="mb-1">
              {line.kind === "input" ? (
                <span className={theme === "dark" ? "text-foreground" : "text-gray-900"}>
                  {line.text}
                </span>
              ) : line.kind === "error" ? (
                <span
                  className={cn(
                    "whitespace-pre-wrap break-all",
                    theme === "dark" ? "text-red-400" : "text-red-600",
                  )}
                >
                  {line.text}
                </span>
              ) : line.kind === "ai-hint" ? (
                <span
                  className={cn(
                    "whitespace-pre-wrap break-all",
                    theme === "dark" ? "text-emerald-400" : "text-emerald-600",
                  )}
                >
                  {line.text || ""}
                </span>
              ) : (
                <span
                  className={cn(
                    "whitespace-pre-wrap break-all",
                    theme === "dark" ? "text-muted-foreground" : "text-gray-600",
                  )}
                >
                  {line.text}
                </span>
              )}
            </div>
          );
        })}
        {!aiStreaming && (
          <div className="flex items-center">
            <span
              className={cn(
                "shrink-0",
                theme === "dark" ? "text-green-400/80" : "text-green-600/80",
              )}
            >
              {promptString(engine)}
            </span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex-1 bg-transparent outline-none ml-1 min-h-[44px] md:min-h-[auto]",
                theme === "dark" ? "text-foreground" : "text-gray-900",
              )}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
});
