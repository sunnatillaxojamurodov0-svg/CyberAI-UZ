import { useState, useEffect, useRef, useCallback } from "react";

export function useStreamingText(fullText: string, speed = 35) {
  const [displayed, setDisplayed] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  const reset = useCallback(() => {
    window.clearInterval(timerRef.current);
    setDisplayed("");
    setIsComplete(false);
  }, []);

  useEffect(() => {
    if (!fullText) {
      reset();
      return;
    }

    reset();

    const words = fullText.split(" ");
    let wordIndex = 0;

    timerRef.current = window.setInterval(() => {
      if (wordIndex < words.length) {
        wordIndex++;
        setDisplayed(words.slice(0, wordIndex).join(" "));
        if (wordIndex === words.length) {
          setIsComplete(true);
          window.clearInterval(timerRef.current);
        }
      }
    }, speed);

    return () => window.clearInterval(timerRef.current);
  }, [fullText, speed]);

  return { displayed, isComplete };
}
