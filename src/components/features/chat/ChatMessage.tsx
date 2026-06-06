import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";
import type { Skill } from "@/lib/skills";
import type { FileAttachment } from "./FilePreview";

interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
  skill?: Skill;
  attachment?: FileAttachment;
  isStreaming?: boolean;
}

/* ── Parse markdown code blocks from plain text ─────────── */

interface ContentPart {
  type: "text" | "code";
  content: string;
  language?: string;
}

function parseContent(text: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", language: match[1] || undefined, content: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: "text", content: text });
  }

  return parts;
}

/* ── Inline code regex for text parts ──────────────────── */

function renderTextPart(text: string) {
  const segments = text.split(/(`[^`]+`)/g);
  return segments.map((seg, i) => {
    if (seg.startsWith("`") && seg.endsWith("`")) {
      const code = seg.slice(1, -1);
      return (
        <code
          key={i}
          className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-accent before:content-none after:content-none"
        >
          {code}
        </code>
      );
    }
    return <span key={i}>{seg}</span>;
  });
}

/* ── Component ─────────────────────────────────────────── */

export function ChatMessage({ role, content, skill, attachment, isStreaming }: ChatMessageProps) {
  const parts = useMemo(
    () => (isStreaming || !content ? null : parseContent(content)),
    [content, isStreaming],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex w-full", role === "user" ? "justify-end" : "justify-start")}
    >
      <div className={cn("max-w-[85%] space-y-2", role === "user" && "items-end")}>
        {/* Sender label */}
        <div className="flex items-center gap-2 px-1">
          <span
            className={cn(
              "font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
              role === "user" ? "text-muted-foreground" : "text-accent",
            )}
          >
            {role === "user" ? "You" : "VAEL"}
          </span>
          {role === "ai" && isStreaming && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
          )}
        </div>

        {/* Message bubble */}
        {role === "user" ? (
          <div className="rounded-2xl bg-accent/10 px-4 py-3 border border-accent/10 space-y-2">
            {skill && (
              <div className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5">
                <skill.icon size={11} className="text-accent" />
                <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                  {skill.label}
                </span>
              </div>
            )}
            {attachment && (
              <div className="flex items-center gap-2.5 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
                {attachment.previewUrl ? (
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.file.name}
                    className="size-10 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10">
                    <span className="text-[10px] font-mono text-accent/70">FILE</span>
                  </div>
                )}
                <div className="min-w-0 flex-1 text-xs text-foreground/70">
                  <div className="truncate font-medium">{attachment.file.name}</div>
                  <div className="text-[10px] text-muted-foreground/60">
                    {(attachment.file.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface/50 border border-border px-4 py-3">
            {isStreaming ? (
              <span className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap relative">
                {content}
                <span className="ml-0.5 inline-block h-[1em] w-[2px] bg-accent animate-blink align-text-bottom" />
              </span>
            ) : parts ? (
              <div className="space-y-3">
                {parts.map((part, i) =>
                  part.type === "code" ? (
                    <CodeBlock key={i} language={part.language || ""} code={part.content} />
                  ) : (
                    <p
                      key={i}
                      className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap"
                    >
                      {renderTextPart(part.content)}
                    </p>
                  ),
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground/60 italic">Processing...</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
