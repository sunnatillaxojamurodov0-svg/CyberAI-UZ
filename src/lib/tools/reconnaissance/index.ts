import type { Tool } from "../../agents";

export const reconnaissanceTools: Tool[] = [
  {
    name: "nmap_scan",
    description: "Run an Nmap scan against a target host or network range",
    category: "reconnaissance",
    parameters: {
      target: { type: "string", description: "Target IP or hostname", required: true },
      ports: { type: "string", description: "Port range (e.g. 1-1000)", default: "1-1000" },
      scanType: {
        type: "string",
        description: "Scan type: tcp-syn, tcp-connect, udp",
        enum: ["tcp-syn", "tcp-connect", "udp"],
        default: "tcp-syn",
      },
    },
    execute: async (params: Record<string, unknown>) => {
      const { target, ports, scanType } = params as {
        target: string;
        ports?: string;
        scanType?: string;
      };
      const portFlag = scanType === "udp" ? "-sU" : scanType === "tcp-connect" ? "-sT" : "-sS";
      return { command: `nmap ${portFlag} -p ${ports ?? "1-1000"} ${target}`, status: "queued" };
    },
  },
  {
    name: "dns_enum",
    description: "Enumerate DNS records for a domain",
    category: "reconnaissance",
    parameters: {
      domain: { type: "string", description: "Target domain", required: true },
      recordType: {
        type: "string",
        description: "DNS record type",
        enum: ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"],
        default: "A",
      },
    },
    execute: async (params: Record<string, unknown>) => {
      const { domain, recordType } = params as { domain: string; recordType?: string };
      return { command: `dig ${domain} ${recordType ?? "A"}`, status: "queued" };
    },
  },
  {
    name: "whois_lookup",
    description: "Perform WHOIS lookup on a domain or IP",
    category: "reconnaissance",
    parameters: {
      query: { type: "string", description: "Domain or IP to query", required: true },
    },
    execute: async (params: Record<string, unknown>) => {
      const { query } = params as { query: string };
      return { command: `whois ${query}`, status: "queued" };
    },
  },
  {
    name: "subdomain_enum",
    description: "Enumerate subdomains using common wordlists",
    category: "reconnaissance",
    parameters: {
      domain: { type: "string", description: "Target domain", required: true },
      wordlist: { type: "string", description: "Wordlist to use", default: "common" },
    },
    execute: async (params: Record<string, unknown>) => {
      const { domain, wordlist } = params as { domain: string; wordlist?: string };
      return {
        command: `gobuster dns -d ${domain} -w /usr/share/wordlists/${wordlist ?? "common"}.txt`,
        status: "queued",
      };
    },
  },
];

export default reconnaissanceTools;
