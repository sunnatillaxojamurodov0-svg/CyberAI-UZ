import type { Tool } from "../../agents";

export const privilegeEscalationTools: Tool[] = [
  {
    name: "linpeas",
    description: "Run LinPEAS privilege escalation enumeration script",
    category: "privilege_escalation",
    parameters: {
      extraArgs: { type: "string", description: "Additional arguments", default: "" },
    },
    execute: async (params: Record<string, unknown>) => {
      const { extraArgs } = params as { extraArgs?: string };
      return {
        command: `curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh ${extraArgs ?? ""}`,
        status: "queued",
      };
    },
  },
  {
    name: "check_suid",
    description: "Find SUID/SGID binaries for privilege escalation",
    category: "privilege_escalation",
    parameters: {},
    execute: async () => {
      return { command: "find / -perm -4000 -type f 2>/dev/null", status: "queued" };
    },
  },
  {
    name: "check_cron",
    description: "List cron jobs writable by current user",
    category: "privilege_escalation",
    parameters: {},
    execute: async () => {
      return {
        command:
          "find /etc/cron* -writable -type f 2>/dev/null; for user in $(cut -f1 -d: /etc/passwd); do crontab -u $user -l 2>/dev/null; done",
        status: "queued",
      };
    },
  },
  {
    name: "kernel_exploit_suggester",
    description: "Suggest kernel exploits based on OS version",
    category: "privilege_escalation",
    parameters: {
      uname: {
        type: "string",
        description: "Kernel version string (from uname -a)",
        required: true,
      },
    },
    execute: async (params: Record<string, unknown>) => {
      const { uname } = params as { uname: string };
      return { command: `searchsploit "linux kernel" ${uname}`, status: "queued" };
    },
  },
];

export default privilegeEscalationTools;
