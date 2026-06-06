import { CloudLightning } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AIModel {
  id: "gemini-2.5-flash";

  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  provider: "gemini";
  modelName: string;
  supportsVision: boolean;
}

export const MODELS: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    label: "VAEL",
    shortLabel: "gm-2.5-flash",
    description: "Google Gemini 2.5 Flash — fast, general-purpose AI mentor",
    icon: CloudLightning,
    provider: "gemini",
    modelName: "gemini-2.5-flash",
    supportsVision: false,
  },
];

export function getModel(id: string): AIModel | undefined {
  return MODELS.find((m) => m.id === id);
}
