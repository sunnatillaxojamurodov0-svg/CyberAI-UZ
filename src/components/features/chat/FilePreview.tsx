import { X, FileText, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export interface FileAttachment {
  file: File;
  previewUrl?: string;
  base64?: string;
}

interface FilePreviewProps {
  attachment: FileAttachment;
  onRemove: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function FilePreview({ attachment, onRemove }: FilePreviewProps) {
  const isImage = attachment.file.type.startsWith("image/");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2.5 pr-10"
    >
      {isImage && attachment.previewUrl ? (
        <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-border">
          <img
            src={attachment.previewUrl}
            alt={attachment.file.name}
            className="size-full object-cover"
          />
        </div>
      ) : (
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent/10">
          {isImage ? (
            <AlertCircle size={18} className="text-accent" />
          ) : (
            <FileText size={18} className="text-accent" />
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground leading-tight">
          {attachment.file.name}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground/60">
          {formatSize(attachment.file.size)}
          {isImage && " · Image"}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/50 hover:text-foreground hover:bg-white/5 transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
