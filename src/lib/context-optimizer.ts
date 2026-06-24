interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ContextWindowConfig {
  maxTokens: number;
  systemPromptTokens: number;
  currentMessageTokens: number;
  reservedTokens: number;
}

const DEFAULT_CONFIG: ContextWindowConfig = {
  maxTokens: 4096,
  systemPromptTokens: 500,
  currentMessageTokens: 200,
  reservedTokens: 200,
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateMessageTokens(message: Message): number {
  return estimateTokens(message.content) + 4;
}

export function optimizeContext(
  history: Message[],
  currentMessage: string,
  config: Partial<ContextWindowConfig> = {},
): Message[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const availableTokens = fullConfig.maxTokens - fullConfig.systemPromptTokens - fullConfig.currentMessageTokens - fullConfig.reservedTokens;

  let totalTokens = 0;
  const selectedMessages: Message[] = [];

  const recentCount = Math.min(10, history.length);
  const recentMessages = history.slice(-recentCount);
  const olderMessages = history.slice(0, -recentCount);

  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const msg = recentMessages[i];
    const msgTokens = estimateMessageTokens(msg);

    if (totalTokens + msgTokens > availableTokens) {
      break;
    }

    selectedMessages.unshift(msg);
    totalTokens += msgTokens;
  }

  const remainingTokens = availableTokens - totalTokens;

  if (remainingTokens > 100 && olderMessages.length > 0) {
    const olderSelected: Message[] = [];
    let olderTokens = 0;

    for (let i = olderMessages.length - 1; i >= 0; i--) {
      const msg = olderMessages[i];
      const msgTokens = estimateMessageTokens(msg);

      if (olderTokens + msgTokens > remainingTokens) {
        break;
      }

      olderSelected.unshift(msg);
      olderTokens += msgTokens;
    }

    if (olderSelected.length > 0) {
      selectedMessages.unshift(...olderSelected);
    }
  }

  return selectedMessages;
}

export function createOptimizedMessages(
  systemPrompt: string | undefined,
  history: Message[],
  currentMessage: string,
  config: Partial<ContextWindowConfig> = {},
): { role: string; content: string }[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const optimizedHistory = optimizeContext(history, currentMessage, config);

  const messages: { role: string; content: string }[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  for (const msg of optimizedHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: "user", content: currentMessage });

  const totalTokens = messages.reduce((acc, msg) => acc + estimateMessageTokens(msg), 0);

  return messages;
}

export function getContextStats(
  history: Message[],
  currentMessage: string,
  config: Partial<ContextWindowConfig> = {},
): {
  totalMessages: number;
  selectedMessages: number;
  estimatedTokens: number;
  availableTokens: number;
  utilization: number;
} {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const optimized = optimizeContext(history, currentMessage, config);
  const totalTokens = optimized.reduce((acc, msg) => acc + estimateMessageTokens(msg), 0);
  const availableTokens = fullConfig.maxTokens - fullConfig.systemPromptTokens - fullConfig.currentMessageTokens - fullConfig.reservedTokens;

  return {
    totalMessages: history.length,
    selectedMessages: optimized.length,
    estimatedTokens: totalTokens,
    availableTokens,
    utilization: Math.round((totalTokens / availableTokens) * 100),
  };
}
