import { CloudLightning } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AIModel {
  id: "gemini-2.5-flash";
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  provider: "gemini";
  modelName: string;
  apiKeyEnv: string;
  baseUrl?: string;
  supportsVision: boolean;
  description: string;
}

export const MODELS: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    label: "VAEL G",
    shortLabel: "Gemini 2.5 Flash",
    icon: CloudLightning,
    provider: "gemini",
    modelName: "gemini-2.5-flash",
    apiKeyEnv: "VITE_GEMINI_API_KEY",
    supportsVision: true,
    description: "Lightning-fast multimodal · Google",
  },
];

export function getModel(id: string): AIModel | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getApiKey(model: AIModel): string {
  const key = import.meta.env[model.apiKeyEnv];
  if (!key) {
    throw new Error(
      `${model.apiKeyEnv} is not set. Add it to your .env file.`,
    );
  }
  return key;
}
