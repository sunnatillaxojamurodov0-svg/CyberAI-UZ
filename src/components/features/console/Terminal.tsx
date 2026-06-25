import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { createEngineState, execute, promptString, type EngineState } from "@/lib/console/engine";
import type { CTFChallenge, TerminalLine } from "@/lib/console/types";

export interface TerminalHandle {
  getState: () => EngineState;
  reset: () => void;
  run: (cmd: string) => void;
}

interface TerminalProps {
  challenge: CTFChallenge;
}

let _lid = 0;
const lid = () => `ln_${++_lid}`;

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
  { challenge },
  ref,
) {
  const [engine, setEngine] = useState<EngineState>(() => createEngineState(challenge));
  const engineRef = useRef(engine);
  engineRef.current = engine;

  const [lines, setLines] = useState<TerminalLine[]>(() => [
    { id: lid(), kind: "system", text: BANNER(challenge) },
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
    setLines([{ id: lid(), kind: "system", text: BANNER(challenge) }]);
    setHistory([]);
    setHistIdx(-1);
    setAiStreaming(false);
    setAiStreamText("");
    aiLineId.current = null;
  }, [challenge]);

  const fetchAiHint = useCallback(
    async (userMessage: string, state: EngineState) => {
      const lineId = lid();
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
          const text = await res.text();
          setAiStreamText(text || "AI Mentor unavailable.");
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setAiStreamText("Failed to connect to AI Mentor.");
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          setAiStreamText(buffer);
        }
      } catch (err) {
        console.error("AI Mentor streaming failed:", err);
        setAiStreamText("Network error while contacting AI Mentor.");
      } finally {
        setAiStreaming(false);
      }
    },
    [challenge, history],
  );

  const runCommand = useCallback(
    (cmd: string) => {
      const state = engineRef.current;
      const prompt = promptString(state);

      setLines((prev) => [...prev, { id: lid(), kind: "input", text: `${prompt}${cmd}` }]);

      if (!cmd.trim()) return;

      const result = execute(state, cmd);

      if (result.output === "__CLEAR__") {
        setLines([]);
        return;
      }

      if (result.kind === "ai-hint") {
        const question = result.output;
        setLines((prev) => [
          ...prev,
          { id: lid(), kind: "output", text: "\u2514 Consulting CyberAI Mentor..." },
        ]);
        setEngine({ ...state });
        fetchAiHint(question, state);
        return;
      }

      setLines((prev) => [
        ...prev,
        {
          id: lid(),
          kind: result.kind === "error" ? "error" : result.kind === "system" ? "system" : "output",
          text: result.output,
        },
      ]);

      setEngine({ ...state });
    },
    [fetchAiHint],
  );

  const handleSubmit = useCallback(() => {
    const cmd = input;
    setInput("");
    if (cmd.trim()) {
      setHistory((prev) => [...prev, cmd]);
    }
    setHistIdx(-1);
    runCommand(cmd);
  }, [input, runCommand]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length === 0) return;
        const next = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(next);
        setInput(history[next] ?? "");
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (histIdx < 0) return;
        const next = histIdx + 1;
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
    },
    [history, histIdx, handleSubmit],
  );

  useImperativeHandle(ref, () => ({
    getState: () => engineRef.current,
    reset: () => {
      const fresh = createEngineState(challenge);
      setEngine(fresh);
      engineRef.current = fresh;
      setLines([{ id: lid(), kind: "system", text: BANNER(challenge) }]);
      setHistory([]);
      setHistIdx(-1);
      setAiStreaming(false);
      setAiStreamText("");
      aiLineId.current = null;
    },
    run: (cmd: string) => runCommand(cmd),
  }));

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-[#0a0e17] overflow-hidden font-mono text-[13px]">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 scrollbar-thin"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line) => {
          if (line.id === aiLineId.current && aiStreamText) {
            return (
              <div key={line.id} className="mb-1">
                <span className={cn("whitespace-pre-wrap break-all", "text-emerald-400")}>
                  {aiStreamText}
                </span>
                {aiStreaming && (
                  <span className="inline-block w-2 h-4 ml-0.5 bg-emerald-400/70 animate-blink align-text-bottom" />
                )}
              </div>
            );
          }
          return (
            <div key={line.id} className="mb-1">
              {line.kind === "input" ? (
                <span className="text-foreground">{line.text}</span>
              ) : line.kind === "error" ? (
                <span className="text-red-400 whitespace-pre-wrap break-all">{line.text}</span>
              ) : line.kind === "ai-hint" ? (
                <span className="text-emerald-400 whitespace-pre-wrap break-all">
                  {line.text || ""}
                </span>
              ) : (
                <span className="text-muted-foreground whitespace-pre-wrap break-all">
                  {line.text}
                </span>
              )}
            </div>
          );
        })}
        {!aiStreaming && (
          <div className="flex items-center">
            <span className="text-green-400/80 shrink-0">{promptString(engine)}</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-foreground outline-none ml-1"
              spellCheck={false}
              autoComplete="off"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
});
