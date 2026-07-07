import type { Tool } from "../../agents";

export const webTools: Tool[] = [
  {
    name: "dir_enum",
    description: "Enumerate directories and files on a web server",
    category: "web",
    parameters: {
      url: { type: "string", description: "Target URL", required: true },
      wordlist: {
        type: "string",
        description: "Wordlist",
        default: "directory-list-2.3-medium.txt",
      },
      extensions: {
        type: "string",
        description: "File extensions (comma-separated)",
        default: "php,asp,html,txt",
      },
    },
    execute: async (params: Record<string, unknown>) => {
      const { url, wordlist, extensions } = params as {
        url: string;
        wordlist?: string;
        extensions?: string;
      };
      return {
        command: `gobuster dir -u ${url} -w /usr/share/wordlists/${wordlist ?? "directory-list-2.3-medium.txt"} -x ${extensions ?? "php,asp,html,txt"}`,
        status: "queued",
      };
    },
  },
  {
    name: "curl_request",
    description: "Make an HTTP request with custom headers",
    category: "web",
    parameters: {
      url: { type: "string", description: "Target URL", required: true },
      method: {
        type: "string",
        description: "HTTP method",
        enum: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        default: "GET",
      },
      headers: { type: "string", description: "Custom headers (JSON format)", default: "{}" },
      data: { type: "string", description: "Request body", default: "" },
    },
    execute: async (params: Record<string, unknown>) => {
      const { url, method, headers, data } = params as {
        url: string;
        method?: string;
        headers?: string;
        data?: string;
      };
      let cmd = `curl -X ${method ?? "GET"}`;
      if (headers && headers !== "{}") {
        try {
          const h = JSON.parse(headers);
          for (const [k, v] of Object.entries(h)) {
            cmd += ` -H "${k}: ${v}"`;
          }
        } catch {
          /* ignore */
        }
      }
      if (data) cmd += ` -d '${data}'`;
      cmd += ` "${url}"`;
      return { command: cmd, status: "queued" };
    },
  },
  {
    name: "nikto_scan",
    description: "Scan web server for vulnerabilities using Nikto",
    category: "web",
    parameters: {
      url: { type: "string", description: "Target URL", required: true },
      ssl: { type: "boolean", description: "Use SSL", default: false },
    },
    execute: async (params: Record<string, unknown>) => {
      const { url, ssl } = params as { url: string; ssl?: boolean };
      return { command: `nikto -h ${url} ${ssl ? "-ssl" : ""}`, status: "queued" };
    },
  },
];

export default webTools;
