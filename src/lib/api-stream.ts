export interface StreamCallbacks {
  onContent?: (content: string) => void;
  onUsage?: (usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  }) => void;
  onDone?: (totalContent: string, hadError: boolean) => void;
  onError?: (err: unknown) => void;
}

export function createSSEStream(
  response: Response,
  callbacks?: StreamCallbacks,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let totalContent = "";
  let hadError = false;

  return new ReadableStream({
    async start(controller) {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                  totalContent += content;
                  callbacks?.onContent?.(content);
                }
                if (parsed.usage) {
                  callbacks?.onUsage?.(parsed.usage);
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        }
      } catch (err) {
        hadError = true;
        const errorMessage = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\n\n[AI response interrupted: ${errorMessage}]`));
        callbacks?.onError?.(err);
      } finally {
        callbacks?.onDone?.(totalContent, hadError);
        controller.close();
      }
    },
  });
}
