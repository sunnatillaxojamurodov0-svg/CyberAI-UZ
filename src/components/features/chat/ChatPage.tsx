import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, Eraser, AlertTriangle, PanelLeftClose, PanelLeft } from "lucide-react";
import { StatusPill } from "@/components/shared/StatusPill";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChatScroll } from "@/hooks/useChatScroll";
import { streamChat } from "@/lib/ai";
import { MODELS, getModel, type AIModel } from "@/lib/models";
import type { Skill } from "@/lib/skills";
import type { FileAttachment } from "./FilePreview";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useProfile";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  skill?: Skill;
  attachment?: FileAttachment;
}

const SUGGESTIONS = [
  "What are the latest CVEs affecting Linux kernels?",
  "Explain the OSCP privilege escalation methodology",
  "Help me understand SQL injection prevention",
  "Design a basic network security audit checklist",
];

let _id = 0;
function uid() {
  return `msg_${Date.now()}_${++_id}`;
}

function ModelSidebar({
  selectedModel,
  onSelectModel,
  isOpen,
  onToggle,
}: {
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isOpen ? "w-72" : "w-0"
      } overflow-hidden border-r border-border bg-surface/50 flex-shrink-0 h-full`}
    >
      <div className="w-72 h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              AI Models
            </h3>
            <button
              type="button"
              onClick={onToggle}
              className="p-1 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Tanlang — har biri o'z sohasida ixtisoslashgan
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {MODELS.map((model) => {
            const Icon = model.icon;
            const isActive = selectedModel.id === model.id;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onSelectModel(model)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? "border-accent/50 bg-accent/10 shadow-lg shadow-accent/5"
                    : "border-border bg-background hover:border-accent/30 hover:bg-accent/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isActive ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-mono text-sm font-medium ${
                        isActive ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {model.label}
                    </div>

                  </div>
                </div>
                {isActive && (
                  <div className="mt-2 pt-2 border-t border-accent/20">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      <span className="text-[10px] font-mono text-accent">ACTIVE</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>


      </div>
    </div>
  );
}

export function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const userName = profile?.name ?? user?.email?.split("@")[0] ?? "Operator";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    const saved = localStorage.getItem("cyberai_selected_model");
    if (saved) {
      const model = getModel(saved);
      if (model) return model;
    }
    return MODELS[0];
  });

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
    async (userInput: string, skill?: Skill, attachment?: FileAttachment) => {
      setIsProcessing(true);
      setApiKeyMissing(false);

      const aiId = uid();
      const aiMessage: Message = { id: aiId, role: "ai", content: "" };

      const update = (fn: (prev: Message[]) => Message[]) => {
        setMessages((prev) => fn(prev));
      };

      update((prev) => [...prev, aiMessage]);

      const skillPrefix = skill
        ? `${skill.promptPrefix}\n\n---\n\nUser query (${skill.label} mode):`
        : "User query:";

      setStreamingId(aiId);

      const currentMessages = messagesRef.current;
      const history = currentMessages
        .filter((m) => m.role === "user" || m.role === "ai")
        .map((m) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        }));

      const prompt = `${skillPrefix} "${userInput}"`;

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
          update((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: accumulated } : m)));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[${selectedModel.modelName}]`, message);

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
                  content: `[${selectedModel.modelName}] ${message}`,
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
    <div className="relative flex h-full max-w-7xl mx-auto">
      <ModelSidebar
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <StatusPill tone="accent">
              {selectedModel.label} · Active
            </StatusPill>
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

        {apiKeyMissing && (
          <div className="mx-6 mb-4 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle size={16} className="text-destructive shrink-0" />
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">AI service is not configured.</span> The
              server OPENROUTER_API_KEY is missing. Contact the administrator.
            </div>
          </div>
        )}

        {hasMessages ? (
          <div className="flex-1 overflow-y-auto pr-2 px-6 scrollbar-thin min-h-0" ref={containerRef}>
            <div className="space-y-5 py-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  skill={msg.skill}
                  attachment={msg.attachment}
                  isStreaming={msg.id === streamingId}
                />
              ))}
            </div>
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
            <div className="grid size-16 place-items-center rounded-2xl bg-accent/10 border border-accent/20">
              <MessageSquare size={28} className="text-accent" />
            </div>
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight">
                VAEL <span className="text-accent">Assistant</span>
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Describe your scenario or ask a security question. VAEL will respond with expertise.
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

        <div className="mt-4 px-6 pb-6">
          <ChatInput onSend={handleSend} disabled={isProcessing} selectedModel={selectedModel} />
        </div>
      </div>
    </div>
  );
}
