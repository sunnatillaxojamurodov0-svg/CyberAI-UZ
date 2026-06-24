import type { AIModel } from "./models";

interface FallbackConfig {
  maxRetries: number;
  retryDelay: number;
  enableFallback: boolean;
}

const DEFAULT_CONFIG: FallbackConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  enableFallback: true,
};

const FALLBACK_CHAINS: Record<string, string[]> = {
  "nvidia/nemotron-3-super-120b-a12b:free": [
    "qwen/qwen-2.5-coder-32b-instruct",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-27b-it",
    "mistralai/mistral-nemo",
  ],
  "qwen/qwen-2.5-coder-32b-instruct": [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-27b-it",
    "mistralai/mistral-nemo",
  ],
  "meta-llama/llama-3.3-70b-instruct:free": [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "qwen/qwen-2.5-coder-32b-instruct",
    "google/gemma-2-27b-it",
    "mistralai/mistral-nemo",
  ],
};

export interface FallbackResult {
  success: boolean;
  model: string;
  response?: Response;
  error?: string;
  attempts: number;
}

export async function fetchWithFallback(
  url: string,
  options: RequestInit,
  primaryModel: string,
  config: Partial<FallbackConfig> = {},
): Promise<FallbackResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const fallbackChain = FALLBACK_CHAINS[primaryModel] || [];

  let lastError: string | null = null;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    const currentModel = attempt === 0 ? primaryModel : fallbackChain[attempt - 1];

    if (!currentModel) {
      break;
    }

    try {
      const modifiedBody = JSON.parse(options.body as string);
      modifiedBody.model = currentModel;
      const modifiedOptions = {
        ...options,
        body: JSON.stringify(modifiedBody),
      };

      const response = await fetch(url, modifiedOptions);

      if (response.ok) {
        return {
          success: true,
          model: currentModel,
          response,
          attempts: attempt + 1,
        };
      }

      if (response.status === 429 || response.status >= 500) {
        lastError = `HTTP ${response.status}`;
        console.log(`Model ${currentModel} failed (${response.status}), trying next...`);

        if (attempt < fullConfig.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, fullConfig.retryDelay));
        }
        continue;
      }

      return {
        success: false,
        model: currentModel,
        response,
        error: `HTTP ${response.status}`,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.log(`Model ${currentModel} failed (${lastError}), trying next...`);

      if (attempt < fullConfig.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, fullConfig.retryDelay));
      }
      continue;
    }
  }

  return {
    success: false,
    model: primaryModel,
    error: lastError || "All models failed",
    attempts: fullConfig.maxRetries + 1,
  };
}

export function getFallbackModels(primaryModel: string): string[] {
  return FALLBACK_CHAINS[primaryModel] || [];
}

export function addFallbackChain(primaryModel: string, fallbacks: string[]): void {
  FALLBACK_CHAINS[primaryModel] = fallbacks;
}
