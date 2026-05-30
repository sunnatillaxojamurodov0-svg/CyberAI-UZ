import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, Eraser, AlertTriangle } from "lucide-react";
import { StatusPill } from "@/components/shared/StatusPill";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChatScroll } from "@/hooks/useChatScroll";
import { streamChat } from "@/lib/ai";
import { TOOL_HANDLERS, TOOL_MAP, classifyIntent } from "@/lib/chat-tools";
import { MODELS, getModel, type AIModel } from "@/lib/models";
import type { ToolStatus } from "./ToolUseCard";
import type { Skill } from "@/lib/skills";
import type { FileAttachment } from "./FilePreview";
import { useAuth } from "@/lib/auth-context";

interface ToolCall {
  id: string;
  name: string;
  status: ToolStatus;
  result?: string;
  error?: string;
  duration?: number;
}

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  skill?: Skill;
  attachment?: FileAttachment;
  toolCalls?: ToolCall[];
}

const SUGGESTIONS = [
  "Audit all SSH ingress from the last 24h",
  "Scan for anomalies in EU-WEST-2",
  "Show me the orbital node status",
  "Run a threat intelligence sweep",
];

let _id = 0;
function uid() {
  return `msg_${Date.now()}_${++_id}`;
}

export function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("cyberai_chat_messages");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    const saved = localStorage.getItem("cyberai_selected_model");
    if (saved) {
      const model = getModel(saved);
      if (model) return model;
    }
    return MODELS[0];
  });
  /* clear guest history on page leave / auth resolve */
  useEffect(() => {
    if (!user && !authLoading) {
      localStorage.removeItem("cyberai_chat_messages");
      setMessages([]);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) return;
    const handler = () => localStorage.removeItem("cyberai_chat_messages");
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [user]);

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("cyberai_selected_model", selectedModel.id);
  }, [selectedModel]);

  const { containerRef, bottomRef } = useChatScroll(messages.length);

  useEffect(() => {
    if (user) {
      localStorage.setItem("cyberai_chat_messages", JSON.stringify(messages));
    }
  }, [messages, user]);

  const generateResponse = useCallback(
    async (
      userInput: string,
      skill?: Skill,
      attachment?: FileAttachment,
    ) => {
      setIsProcessing(true);
      setApiKeyMissing(false);

      /* ---- intent + tools ---- */
      const intent = classifyIntent(userInput);
      const toolNames = TOOL_MAP[intent] || [];

      const toolCalls: ToolCall[] = toolNames.map((name) => ({
        id: uid(),
        name,
        status: "loading" as ToolStatus,
      }));

      const aiId = uid();
      const aiMessage: Message = { id: aiId, role: "ai", content: "", toolCalls };

      const update = (fn: (prev: Message[]) => Message[]) => {
        setMessages((prev) => fn(prev));
      };

      update((prev) => [...prev, aiMessage]);

      /* ---- execute simulated tools ---- */
      let toolContext = "";

      if (toolCalls.length > 0) {
        const results = await Promise.all(
          toolCalls.map(async (tc) => {
            const handler = TOOL_HANDLERS[tc.name];
            if (!handler) {
              return { ...tc, status: "error" as ToolStatus, error: `Unknown tool: ${tc.name}` };
            }
            try {
              const { result, duration } = await handler();
              toolContext += `[Tool: ${tc.name}]\n${result}\n\n`;
              return { ...tc, status: "success" as ToolStatus, result, duration };
            } catch (err) {
              return { ...tc, status: "error" as ToolStatus, error: String(err) };
            }
          }),
        );

        update((prev) =>
          prev.map((m) => (m.id === aiId ? { ...m, toolCalls: results } : m)),
        );
      }

      /* ---- skill context prefix ---- */
      const skillPrefix = skill
        ? `${skill.promptPrefix}\n\n---\n\nUser query (${skill.label} mode):`
        : "User query:";

      /* ---- AI streaming ---- */
      setStreamingId(aiId);

      const currentMessages = messagesRef.current;
      const history = currentMessages
        .filter((m) => m.role === "user" || m.role === "ai")
        .map((m) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        }));

      const prompt = toolContext
        ? `${skillPrefix} "${userInput}"\n\nTool execution results:\n${toolContext}\n\nBased on the tool results above, provide a comprehensive response to the user's query.`
        : `${skillPrefix} "${userInput}"`;

      try {
        let accumulated = "";
        for await (const chunk of streamChat({
          history,
          message: prompt,
          model: selectedModel,
          imageBase64: attachment?.base64,
          imageMimeType: attachment?.file.type,
        })) {
          accumulated += chunk;
          update((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, content: accumulated } : m)),
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[${selectedModel.label}]`, message);

        if (
          message.includes("API_KEY") ||
          message.includes("API key") ||
          message.includes("not set") ||
          message.includes("401") ||
          message.includes("403")
        ) {
          setApiKeyMissing(true);
        }

        update((prev) =>
          prev.map((m) =>
            m.id === aiId
              ? {
                  ...m,
                  content: `[${selectedModel.label}] ${message}`,
                  toolCalls: (m.toolCalls ?? []).map((tc) =>
                    tc.status === "loading"
                      ? { ...tc, status: "error" as ToolStatus, error: message }
                      : tc,
                  ),
                }
              : m,
          ),
        );
      }

      setStreamingId(null);
      setIsProcessing(false);
    },
    [selectedModel],
  );

  const handleSend = useCallback(
    (input: string, skill?: Skill, attachment?: FileAttachment) => {
      const userMsg: Message = {
        id: uid(),
        role: "user",
        content: input,
        skill,
        attachment,
      };
      setMessages((prev) => [...prev, userMsg]);
      generateResponse(input, skill, attachment);
    },
    [generateResponse],
  );

  const handleClear = useCallback(() => {
    setMessages([]);
    localStorage.removeItem("cyberai_chat_messages");
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col px-6 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusPill tone="accent">VAEL · Active</StatusPill>
          </div>
          {hasMessages && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eraser size={12} />
              Clear session
            </button>
          )}
        </div>

        {/* API key missing banner */}
        {apiKeyMissing && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle size={16} className="text-destructive shrink-0" />
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {selectedModel.apiKeyEnv} not configured.
              </span>{" "}
              Add <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[10px]">{selectedModel.apiKeyEnv}</code>{" "}
              to your .env file, then reload.
            </div>
          </div>
        )}

        {/* Messages / Empty state */}
        {hasMessages ? (
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin min-h-0" ref={containerRef}>
            <div className="space-y-5 py-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  skill={msg.skill}
                  attachment={msg.attachment}
                  toolCalls={msg.toolCalls}
                  isStreaming={msg.id === streamingId}
                />
              ))}
            </div>
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="grid size-16 place-items-center rounded-2xl bg-accent/10 border border-accent/20">
              <MessageSquare size={28} className="text-accent" />
            </div>
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                VAEL <span className="text-accent">Assistant</span>
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Describe the posture you need. Scan, query, and command your infrastructure in natural language.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent font-mono"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <ChatInput onSend={handleSend} disabled={isProcessing} selectedModel={selectedModel} onModelChange={setSelectedModel} />
        </div>
    </div>
  );
}
