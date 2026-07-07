import type { Tool, ToolCategory } from "../agents";

let cachedTools: Tool[] | null = null;

export async function discoverTools(): Promise<Tool[]> {
  if (cachedTools) return cachedTools;

  const modules = import.meta.glob<{ default: Tool[] }>("./*/index.ts", { eager: false });
  const allTools: Tool[] = [];

  for (const [path, loader] of Object.entries(modules)) {
    try {
      const mod = await loader();
      if (mod.default && Array.isArray(mod.default)) {
        allTools.push(...mod.default);
      }
    } catch (err) {
      console.warn(`Failed to load tools from ${path}:`, err);
    }
  }

  cachedTools = allTools;
  return allTools;
}

export function getToolsByCategory(tools: Tool[], category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category);
}

export function getToolByName(tools: Tool[], name: string): Tool | undefined {
  return tools.find((t) => t.name === name);
}

export function getToolNames(tools: Tool[]): string[] {
  return tools.map((t) => t.name);
}

export function clearToolCache(): void {
  cachedTools = null;
}
