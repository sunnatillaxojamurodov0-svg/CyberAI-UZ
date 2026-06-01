import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";
import {
  createEngineState,
  execute,
  promptString,
  type EngineState,
} from "@/lib/console/engine";
import type { CTFChallenge, TerminalLine } from "@/lib/console/types";

export interface TerminalHandle {
  /** Current engine state (telemetry, shells, etc.). */
  getState: () => EngineState;
  /** Reset the terminal for a fresh attempt. */
  reset: () => void;
  /** Programmatically run a command (e.g. from a hint button). */
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

'help' — list of tools. Good luck, operator.
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  /* Re-init when challenge changes */
  useEffect(() => {
    const fresh = createEngineState(challenge);
    setEngine(fresh);
    engineRef.current = fresh;
    setLines([{ id: lid(), kind: "system", text: BANNER(challenge) }]);
    setHistory([]);
    setHistIdx(-1);
  }, [challenge]);

  const runCommand = useCallback((cmd: string) => {
    const state = engineRef.current;
    const prompt = promptString(state);

    setLines((prev) => [
      ...prev,
      { id: lid(), kind: "input", text: `${prompt}${cmd}` },
    ]);

    if (!cmd.trim()) return;

    const result = execute(state, cmd);

    if (result.output === "__CLEAR__") {
      setLines([]);
      return;
    }

    setLines((prev) => [
      ...prev,
      { id: lid(), kind: result.kind === "error" ? "error" : result.kind === "system" ? "system" : "output", text: result.output },
    ]);

    // force state object identity change so consumers re-read telemetry
    setEngine({ ...state });
  }, []);

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
    [handleSubmit, history, histIdx],
  );

  useImperativeHandle(
    ref,
    () => ({
      getState: () => engineRef.current,
      reset: () => {
        const fresh = createEngineState(challenge);
        setEngine(fresh);
        engineRef.current = fresh;
        setLines([{ id: lid(), kind: "system", text: BANNER(challenge) }]);
        setHistory([]);
        setHistIdx(-1);
      },
      run: (cmd: string) => runCommand(cmd),
    }),
    [challenge, runCommand],
  );

  const prompt = promptString(engine);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-black/80 font-mono"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal chrome */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface/60 px-4 py-2.5">
        <span className="size-3 rounded-full bg-red-500/80" />
        <span className="size-3 rounded-full bg-yellow-500/80" />
        <span className="size-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          root@kali: ~ (sandbox)
        </span>
      </div>

      {/* Scroll area */}
      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto px-4 py-3 text-[13px] leading-relaxed">
        {lines.map((ln) => (
          <pre
            key={ln.id}
            className={cn(
              "whitespace-pre-wrap break-words font-mono",
              ln.kind === "input" && "text-foreground",
              ln.kind === "output" && "text-foreground/80",
              ln.kind === "error" && "text-red-400",
              ln.kind === "system" && "text-primary/90",
            )}
          >
            {ln.text}
          </pre>
        ))}

        {/* Active prompt line */}
        <div className="flex items-start gap-0">
          <pre className="shrink-0 whitespace-pre-wrap font-mono text-primary/90">{prompt}</pre>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            className="flex-1 bg-transparent font-mono text-[13px] text-foreground caret-primary outline-none"
            aria-label="Terminal input"
          />
        </div>
      </div>
    </div>
  );
});
