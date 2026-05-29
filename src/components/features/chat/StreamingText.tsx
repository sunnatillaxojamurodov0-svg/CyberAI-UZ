import { useStreamingText } from "@/hooks/useStreamingText";
import { cn } from "@/lib/utils";

interface StreamingTextProps {
  text: string;
  speed?: number;
  className?: string;
  showCursor?: boolean;
}

export function StreamingText({
  text,
  speed = 35,
  className,
  showCursor = true,
}: StreamingTextProps) {
  const { displayed, isComplete } = useStreamingText(text, speed);

  if (!text) return null;

  return (
    <span className={cn("relative leading-relaxed whitespace-pre-wrap", className)}>
      {displayed}
      {showCursor && !isComplete && (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] bg-accent animate-blink align-text-bottom" />
      )}
    </span>
  );
}
