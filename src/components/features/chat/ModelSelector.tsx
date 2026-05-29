import { Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MODELS, type AIModel } from "@/lib/models";

interface ModelSelectorProps {
  selected: AIModel;
  onChange: (model: AIModel) => void;
}

export function ModelSelector({ selected, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "glass-panel flex items-center gap-2.5 rounded-xl border border-border px-3.5 py-2 text-sm transition-all duration-300",
          open ? "border-accent/40 shadow-[0_0_20px_-8px] shadow-accent/20" : "hover:border-accent/20",
        )}
      >
        <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent/10">
          <selected.icon size={14} className="text-accent" />
        </div>
        <div className="min-w-0 text-left">
          <div className="truncate text-xs font-semibold text-foreground leading-tight">
            {selected.label}
          </div>
          <div className="truncate text-[10px] text-muted-foreground/60 leading-tight">
            {selected.shortLabel}
          </div>
        </div>
        <ChevronDown
          size={13}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl"
          >
            <div className="p-1">
              {MODELS.map((model) => {
                const isSelected = model.id === selected.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onChange(model);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      isSelected
                        ? "bg-accent/10 text-accent"
                        : "text-foreground/70 hover:bg-white/5",
                    )}
                  >
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10">
                      <model.icon size={15} className="text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium leading-tight">{model.label}</span>
                        <span className="text-[10px] text-muted-foreground/40 font-mono">{model.shortLabel}</span>
                        {isSelected && <Check size={12} className="shrink-0 text-accent" />}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground/60 leading-tight truncate">
                        {model.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
