import { useEffect, useRef } from "react";

export function useChatScroll(messageCount: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messageCount]);

  return { containerRef, bottomRef };
}
