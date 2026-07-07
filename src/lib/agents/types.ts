export interface Tool {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: Record<string, ParameterSchema>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export type ToolCategory =
  | "reconnaissance"
  | "exploitation"
  | "privilege_escalation"
  | "lateral_movement"
  | "web"
  | "network"
  | "data_exfiltration"
  | "command_and_control"
  | "utility";

export interface ParameterSchema {
  type: "string" | "number" | "boolean" | "array";
  description: string;
  required?: boolean;
  enum?: string[];
  default?: unknown;
}

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface TurnResult {
  output: string;
  messages: AgentMessage[];
  toolCalls: ToolCallResult[];
  turns: number;
}

export interface ToolCallResult {
  tool: string;
  params: unknown;
  result: unknown;
  duration: number;
  error?: string;
}

export class Agent {
  readonly name: string;
  readonly instructions: string;
  readonly tools: Tool[];
  readonly handoffs: Agent[];
  readonly model?: string;
  readonly maxTurns: number;

  constructor(config: {
    name: string;
    instructions: string;
    tools?: Tool[];
    handoffs?: Agent[];
    model?: string;
    maxTurns?: number;
  }) {
    this.name = config.name;
    this.instructions = config.instructions;
    this.tools = config.tools ?? [];
    this.handoffs = config.handoffs ?? [];
    this.model = config.model;
    this.maxTurns = config.maxTurns ?? 25;
  }
}

export function functionTool(config: {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: Record<string, ParameterSchema>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}): Tool {
  return config;
}
