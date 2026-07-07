import { Agent } from "./types";
import type { AgentMessage, TurnResult, ToolCallResult } from "./types";

const MAX_TOOL_CALLS_PER_TURN = 10;

function buildSystemPrompt(agent: Agent): string {
  const toolDescriptions = agent.tools
    .map((t) => `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`)
    .join("\n");

  const handoffDescriptions = agent.handoffs
    .map((h) => `- ${h.name}: ${h.instructions.slice(0, 100)}`)
    .join("\n");

  let prompt = agent.instructions;

  if (toolDescriptions) {
    prompt += `\n\n## Available Tools\n${toolDescriptions}`;
  }

  if (handoffDescriptions) {
    prompt += `\n\n## Available Handoffs\n${handoffDescriptions}`;
  }

  prompt += `\n\nTo call a tool, respond with:\n\`\`\`json\n{"tool": "tool_name", "params": {...}}\n\`\`\``;

  return prompt;
}

function parseToolCall(content: string): { name: string; params: Record<string, unknown> } | null {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed.tool && parsed.params) {
      return { name: parsed.tool, params: parsed.params };
    }
  } catch {
    /* not a valid tool call */
  }
  return null;
}

async function callLLM(messages: AgentMessage[], model?: string): Promise<string> {
  const { getEnv } = await import("../db");
  const env = getEnv();
  const groqKey = (env as Record<string, unknown>).GROQ_API_KEY as string;

  if (!groqKey) return "AI service not configured.";

  const selectedModel = model || "openai/gpt-oss-120b";

  const apiMessages = messages.map((m) => ({
    role: m.role === "tool" ? "user" : m.role,
    content: m.role === "tool" ? `Tool ${m.toolName} result: ${m.content}` : m.content,
  }));

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cyberaiuz.workers.dev",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: apiMessages,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? "No response";
  } catch {
    return "API call failed.";
  }
}

export class Runner {
  static async run(
    agent: Agent,
    input: string,
    options?: { maxTurns?: number },
  ): Promise<TurnResult> {
    const maxTurns = options?.maxTurns ?? agent.maxTurns;
    const messages: AgentMessage[] = [
      { role: "system", content: buildSystemPrompt(agent) },
      { role: "user", content: input },
    ];

    const toolCalls: ToolCallResult[] = [];
    let turnCount = 0;

    while (turnCount < maxTurns) {
      turnCount++;

      const llmResponse = await callLLM(messages, agent.model);

      messages.push({ role: "assistant", content: llmResponse });

      const toolCall = parseToolCall(llmResponse);
      if (!toolCall) {
        return {
          output: llmResponse,
          messages,
          toolCalls,
          turns: turnCount,
        };
      }

      const tool = agent.tools.find((t) => t.name === toolCall.name);
      if (tool) {
        const start = Date.now();
        try {
          const result = await tool.execute(toolCall.params);
          toolCalls.push({
            tool: tool.name,
            params: toolCall.params,
            result,
            duration: Date.now() - start,
          });
          messages.push({
            role: "tool",
            content: typeof result === "string" ? result : JSON.stringify(result),
            toolName: tool.name,
            toolCallId: `${tool.name}-${turnCount}`,
          });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          toolCalls.push({
            tool: tool.name,
            params: toolCall.params,
            result: null,
            duration: Date.now() - start,
            error: errorMsg,
          });
          messages.push({
            role: "tool",
            content: `Error: ${errorMsg}`,
            toolName: tool.name,
            toolCallId: `${tool.name}-${turnCount}`,
          });
        }
      } else {
        const handoff = agent.handoffs.find(
          (h) => h.name === toolCall.name.replace("transfer_to_", ""),
        );
        if (handoff) {
          const handoffResult = await Runner.run(handoff, JSON.stringify(toolCall.params), {
            maxTurns: 5,
          });
          messages.push({
            role: "tool",
            content: handoffResult.output,
            toolName: handoff.name,
            toolCallId: `handoff-${turnCount}`,
          });
          toolCalls.push(...handoffResult.toolCalls);
        }
      }

      if (toolCalls.length > MAX_TOOL_CALLS_PER_TURN) break;
    }

    const lastMsg = [...messages].reverse().find((m) => m.role === "assistant");
    return {
      output: lastMsg?.content ?? "Max turns reached",
      messages,
      toolCalls,
      turns: turnCount,
    };
  }
}
