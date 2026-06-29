import { useState, useRef, useCallback, useEffect, type FormEvent } from "react";
import { Send, X, Plus, Image, Paperclip, Bot, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SKILLS, type Skill } from "@/lib/skills";
import type { AIModel } from "@/lib/models";
import { FilePreview, type FileAttachment } from "./FilePreview";

const MAX_FILE_SIZE = 30 * 1024 * 1024;

interface ChatInputProps {
  onSend: (message: string, skill?: Skill, attachment?: FileAttachment) => void;
  disabled?: boolean;
  selectedModel: AIModel;
}

export function ChatInput({ onSend, disabled, selectedModel }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [filter, setFilter] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  const filtered = filter
    ? SKILLS.filter((s) => s.label.toLowerCase().includes(filter.toLowerCase()))
    : SKILLS;

  useEffect(() => {
    setActiveIndex(0);
  }, [filter]);

  /* Close picker on outside click */
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  /* Close file menu on outside click */
  useEffect(() => {
    if (!showFileMenu) return;
    const handler = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setShowFileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showFileMenu]);

  const selectSkill = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
    setShowPicker(false);
    setFilter("");
    setValue((prev) => {
      const slashIdx = prev.lastIndexOf("/");
      if (slashIdx >= 0) return prev.slice(0, slashIdx);
      return prev;
    });
    inputRef.current?.focus();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const raw = e.target.value;

      const slashIdx = raw.lastIndexOf("/");
      if (slashIdx >= 0 && (slashIdx === 0 || raw[slashIdx - 1] === " ")) {
        const afterSlash = raw.slice(slashIdx + 1);
        if (!afterSlash.includes(" ")) {
          setShowPicker(true);
          setFilter(afterSlash);
          setValue(raw);
          return;
        }
      }

      if (showPicker) setShowPicker(false);
      setValue(raw);
    },
    [showPicker],
  );

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      if ((!value.trim() && !attachment) || disabled) return;

      onSend(value.trim(), selectedSkill ?? undefined, attachment ?? undefined);
      setValue("");
      setSelectedSkill(null);
      if (attachment) {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
        setAttachment(null);
      }
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    },
    [value, attachment, disabled, onSend, selectedSkill],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showPicker && filtered.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % filtered.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
          return;
        }
        if (e.key === "Enter" && filtered[activeIndex]) {
          e.preventDefault();
          selectSkill(filtered[activeIndex]);
          return;
        }
        if (e.key === "Escape") {
          setShowPicker(false);
          return;
        }
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [showPicker, filtered, activeIndex, selectSkill, handleSubmit],
  );

  const processFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum is 30 MB.`,
      });
      return;
    }

    let previewUrl: string | undefined;
    let base64: string | undefined;

    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
      base64 = await fileToBase64(file);
    }

    setAttachment({ file, previewUrl, base64 });
    setShowFileMenu(false);
    inputRef.current?.focus();
  }, []);

  const handleFilePick = useCallback(
    (accept: string) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.onchange = () => {
        const f = input.files?.[0];
        if (f) processFile(f);
      };
      input.click();
    },
    [processFile],
  );

  const handleInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const clearSkill = () => {
    setSelectedSkill(null);
    inputRef.current?.focus();
  };

  const removeAttachment = () => {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
    inputRef.current?.focus();
  };

  const canSend = (value.trim() || attachment) && !disabled;

  return (
    <div className="relative">
      {/* Skill badge */}
      {selectedSkill && (
        <div className="mb-1.5 flex items-center gap-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1">
            <selectedSkill.icon size={12} className="text-accent" />
            <span className="text-[11px] font-medium text-accent tracking-wide uppercase">
              {selectedSkill.label}
            </span>
            <button
              type="button"
              onClick={clearSkill}
              className="ml-0.5 rounded p-0.5 text-accent/60 hover:text-accent transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      {/* File attachment preview */}
      {attachment && (
        <div className="mb-1.5">
          <FilePreview attachment={attachment} onRemove={removeAttachment} />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-1.5 rounded-2xl border border-border bg-surface/80 px-3 py-3 focus-within:border-accent/40 focus-within:shadow-[0_0_30px_-8px] focus-within:shadow-accent/20 transition-all duration-300"
      >
        {/* + button */}
        <div className="relative flex shrink-0">
          <button
            type="button"
            onClick={() => setShowFileMenu((v) => !v)}
            className={cn(
              "grid size-9 place-items-center rounded-xl transition-all duration-200",
              showFileMenu
                ? "bg-accent text-white shadow-[0_0_12px_-4px] shadow-accent/40"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5",
            )}
            aria-label="Add file"
          >
            <Plus
              size={16}
              className={cn("transition-transform duration-200", showFileMenu && "rotate-45")}
            />
          </button>

          {/* File menu popup */}
          {showFileMenu && (
            <div
              ref={fileMenuRef}
              className="absolute bottom-full left-0 mb-2 w-48 overflow-hidden rounded-xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl"
            >
              <button
                type="button"
                onClick={() => handleFilePick("image/*")}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm text-foreground/80 hover:bg-white/5 transition-colors"
              >
                <div className="grid size-8 place-items-center rounded-lg bg-accent/10">
                  <Image size={14} className="text-accent" />
                </div>
                <div>
                  <div className="font-medium leading-tight">Add image</div>
                  <div className="text-[11px] text-muted-foreground/60 leading-tight">
                    Galereya / Kamera
                  </div>
                </div>
              </button>
              <div className="mx-3 h-px bg-border" />
              <button
                type="button"
                onClick={() => handleFilePick("*/*")}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm text-foreground/80 hover:bg-white/5 transition-colors"
              >
                <div className="grid size-8 place-items-center rounded-lg bg-accent/10">
                  <Paperclip size={14} className="text-accent" />
                </div>
                <div>
                  <div className="font-medium leading-tight">Add File</div>
                  <div className="text-[11px] text-muted-foreground/60 leading-tight">
                    Any file type
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Hidden model badge — always VAEL, no selector shown */}
        <div className="hidden shrink-0">
          {selectedModel.id === "groq-gpt" ? (
            <Zap size={13} className="text-accent" />
          ) : (
            <Bot size={13} className="text-accent" />
          )}
        </div>

        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={selectedSkill ? `Ask about ${selectedSkill.label}...` : "Awaiting command_"}
          disabled={disabled}
          rows={1}
          className="min-h-[24px] max-h-[120px] flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50 font-mono disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl transition-all duration-300",
            canSend
              ? "bg-accent text-white shadow-[0_0_20px_-4px] shadow-accent/40 hover:shadow-accent/60 hover:brightness-110"
              : "bg-surface-2 text-muted-foreground",
          )}
        >
          <Send size={15} />
        </button>
      </form>

      {/* Skill picker dropdown */}
      {showPicker && filtered.length > 0 && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl"
        >
          <div className="max-h-64 overflow-y-auto p-1.5">
            {filtered.map((skill, idx) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => selectSkill(skill)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  idx === activeIndex
                    ? "bg-accent/10 text-accent"
                    : "text-foreground/80 hover:bg-white/5",
                )}
              >
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10">
                  <skill.icon size={15} className="text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight">{skill.label}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground/70 leading-tight truncate">
                    {skill.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground/50 font-mono">
            ↑↓ navigate · ↵ select · esc close
          </div>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
