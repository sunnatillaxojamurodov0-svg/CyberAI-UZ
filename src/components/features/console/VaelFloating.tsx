import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Bot, Minus, Send, Sparkles, X } from "lucide-react";
import { streamChat } from "@/lib/ai";
import { MODELS } from "@/lib/models";
import { cn } from "@/lib/utils";
import type { CTFChallenge } from "@/lib/console/types";

interface VaelMsg {
  id: string;
  role: "user" | "ai";
  content: string;
}

interface VaelFloatingProps {
  /** Active challenge context, so VAEL can give scoped guidance. */
  challenge: CTFChallenge | null;
  /** Called whenever the operator sends a message — feeds scorer telemetry. */
  onUserMessage?: (text: string) => void;
}

let _vid = 0;
const vuid = () => `vael_${Date.now()}_${++_vid}`;

/**
 * Floating VAEL assistant for the Console.
 * - Collapsed: a draggable circular icon.
 * - Expanded: a chat window that occupies ~1/5 of the viewport.
 * - Minimize returns it to the circle. Both states are draggable anywhere.
 */
export function VaelFloating({ challenge, onUserMessage }: VaelFloatingProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<VaelMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef(false);

  /* Auto-scroll on new content */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const buildContextPrompt = useCallback(
    (userText: string): string => {
      if (!challenge) return userText;
      return [
        "The operator is currently working on the following CTF challenge. Do NOT give them the SOLUTION directly — guide them toward thinking, choosing the right tool and technique. Never reveal the flag.",
        "",
        `CTF: ${challenge.title} (Daraja ${challenge.level}, ${challenge.category})`,
        `Stsenariy: ${challenge.scenario}`,
        `Maqsadlar: ${challenge.objectives.join("; ")}`,
        `Target: ${challenge.targetIp}`,
        "",
        `Operator savoli: ${userText}`,
      ].join("\n");
    },
    [challenge],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streamingRef.current) return;

      onUserMessage?.(trimmed);

      const userMsg: VaelMsg = { id: vuid(), role: "user", content: trimmed };
      const aiId = vuid();
      setMessages((prev) => [...prev, userMsg, { id: aiId, role: "ai", content: "" }]);
      setInput("");
      setStreaming(true);
      streamingRef.current = true;

      const history = messages.map((m) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

      try {
        let acc = "";
        const model = MODELS[0];
        if (!model) {
          throw new Error("No AI models configured");
        }
        for await (const chunk of streamChat({
          history,
          message: buildContextPrompt(trimmed),
          model,
        })) {
          acc += chunk;
          setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: acc } : m)));
        }
        if (!acc) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, content: "VAEL did not respond. Please try again." } : m,
            ),
          );
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId
              ? {
                  ...m,
                  content: msg.includes("API")
                    ? "VAEL API key is not configured on the server."
                    : `Xato: ${msg}`,
                }
              : m,
          ),
        );
      } finally {
        setStreaming(false);
        streamingRef.current = false;
      }
    },
    [messages, buildContextPrompt, onUserMessage],
  );

  return (
    <div
      ref={constraintsRef}
      className="pointer-events-none fixed inset-0 z-[60]"
      aria-hidden={false}
    >
      {/* Collapsed — draggable circular icon */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            drag
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            dragElastic={0.08}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            style={{ bottom: 28, right: 28, position: "absolute" }}
            className="pointer-events-auto grid size-15 cursor-grab touch-none place-items-center rounded-full active:cursor-grabbing"
          >
            <span className="absolute inset-0 rounded-full bg-accent/30 blur-xl" />
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-primary opacity-90" />
            <span className="absolute inset-0 animate-pulse-soft rounded-full ring-2 ring-accent/50" />
            <span className="relative grid size-12 place-items-center rounded-full bg-background/40 backdrop-blur-sm">
              <Bot size={22} className="text-foreground" />
            </span>
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-primary" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded — draggable chat window (~1/5 of viewport) */}
      <AnimatePresence>
        {open && (
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={constraintsRef}
            dragMomentum={false}
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ bottom: 28, right: 28, position: "absolute" }}
            className="pointer-events-auto flex h-[min(78vh,640px)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-2xl border border-accent/25 bg-surface/95 shadow-2xl shadow-accent/10 backdrop-blur-xl"
          >
            {/* Header — drag handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex shrink-0 cursor-grab items-center justify-between border-b border-border bg-gradient-to-r from-accent/10 to-primary/5 px-4 py-3 active:cursor-grabbing"
            >
              <div className="flex items-center gap-2.5">
                <span className="relative grid size-8 place-items-center rounded-lg bg-accent/15">
                  <Bot size={16} className="text-accent" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  </span>
                </span>
                <div className="leading-tight">
                  <div className="font-display text-sm font-bold">VAEL</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    {challenge ? `${challenge.title}` : "CTF Co-pilot"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  aria-label="Minimize"
                  title="Minimize (circle mode)"
                >
                  <Minus size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setMessages([]);
                  }}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  aria-label="Close & clear"
                  title="Close and clear"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                  <span className="grid size-12 place-items-center rounded-xl bg-accent/10">
                    <Sparkles size={20} className="text-accent" />
                  </span>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    I'm VAEL — your CTF companion. I help with tool selection, technique, and
                    thinking. You find the flag yourself.
                  </p>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {[
                      "Which tool should I start with?",
                      "How do I check this port?",
                      "What's the next step?",
                    ].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap",
                          m.role === "user"
                            ? "bg-accent/15 text-foreground"
                            : "border border-border bg-surface text-foreground/90",
                        )}
                      >
                        {m.content || (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <span className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
                            <span className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
                            <span className="size-1.5 animate-bounce rounded-full bg-accent" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex shrink-0 items-end gap-2 border-t border-border bg-surface/80 px-3 py-3"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="Ask VAEL..."
                disabled={streaming}
                className="max-h-24 min-h-[36px] flex-1 resize-none rounded-xl border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-accent/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl transition-all",
                  input.trim() && !streaming
                    ? "bg-accent text-white shadow-[0_0_18px_-4px] shadow-accent/40 hover:brightness-110"
                    : "bg-surface-2 text-muted-foreground",
                )}
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
