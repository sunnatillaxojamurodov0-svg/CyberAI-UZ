import type { Tool } from "../../agents";

export const networkTools: Tool[] = [
  {
    name: "netcat_listen",
    description: "Start a netcat listener on a specified port",
    category: "network",
    parameters: {
      port: { type: "number", description: "Port to listen on", required: true },
      protocol: { type: "string", description: "Protocol", enum: ["tcp", "udp"], default: "tcp" },
    },
    execute: async (params: Record<string, unknown>) => {
      const { port, protocol } = params as { port: number; protocol?: string };
      return {
        command: `nc ${protocol === "udp" ? "-u" : ""} -lvnp ${port}`,
        status: "queued",
        bind_port: port,
      };
    },
  },
  {
    name: "netcat_connect",
    description: "Connect to a remote host using netcat",
    category: "network",
    parameters: {
      host: { type: "string", description: "Target host", required: true },
      port: { type: "number", description: "Target port", required: true },
    },
    execute: async (params: Record<string, unknown>) => {
      const { host, port } = params as { host: string; port: number };
      return { command: `nc -v ${host} ${port}`, status: "queued" };
    },
  },
  {
    name: "traceroute",
    description: "Trace the network path to a target",
    category: "network",
    parameters: {
      target: { type: "string", description: "Target hostname or IP", required: true },
    },
    execute: async (params: Record<string, unknown>) => {
      const { target } = params as { target: string };
      return { command: `traceroute ${target}`, status: "queued" };
    },
  },
  {
    name: "smb_enum",
    description: "Enumerate SMB shares on a target",
    category: "network",
    parameters: {
      target: { type: "string", description: "Target IP", required: true },
    },
    execute: async (params: Record<string, unknown>) => {
      const { target } = params as { target: string };
      return { command: `smbclient -L //${target} -N`, status: "queued" };
    },
  },
];

export default networkTools;
