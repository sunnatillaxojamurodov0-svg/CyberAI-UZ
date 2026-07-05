/* ──────────────────────────────────────────────────────────────
   CyberAI · Virtual Console Engine
   A fully sandboxed Kali-style command interpreter. It NEVER opens
   a real socket — every "tool" reads from the challenge's in-memory
   virtual environment, so it is physically impossible to attack any
   host outside the CTF scenario.
   ────────────────────────────────────────────────────────────── */

import type { CTFChallenge, VHost, SolveTelemetry } from "./types";

export interface ShellSession {
  /** Host the operator currently has an interactive shell on (null = local Kali). */
  host: VHost | null;
  /** Username on that host. */
  user: string;
  /** Whether the current shell is root/admin. */
  root: boolean;
  /** Current working directory. */
  cwd: string;
}

export interface EngineState {
  challenge: CTFChallenge;
  /** Local Kali box virtual filesystem (artifacts + cracked outputs). */
  localFs: Record<string, string>;
  /** Stack of shells — index 0 is local Kali. */
  shells: ShellSession[];
  /** Hosts the operator has discovered creds/shell access to. */
  compromised: Set<string>;
  /** Telemetry for scoring. */
  telemetry: SolveTelemetry;
}

export interface CommandResult {
  output: string;
  kind: "output" | "error" | "system" | "ai-hint";
  /** If the command changed the prompt (e.g. ssh/exit), engine updates state. */
  promptChanged?: boolean;
}

const COMMON_WORDLIST = [
  "admin",
  "login",
  "config",
  "backup",
  "uploads",
  "images",
  "css",
  "js",
  "api",
  "secret-admin-7421",
  "private",
  "portal",
  "dashboard",
  "robots.txt",
];

/* ── State bootstrap ─────────────────────────────────────────── */

export function createEngineState(challenge: CTFChallenge): EngineState {
  const localFs: Record<string, string> = {
    "/root/readme.txt":
      "CyberAI Kali sandbox.\nThis environment is fully isolated — only CTF targets exist.\nStart with the 'help' command.",
    ...(challenge.env.localFiles ?? {}),
  };

  return {
    challenge,
    localFs,
    shells: [{ host: null, user: "root", root: true, cwd: "/root" }],
    compromised: new Set<string>(),
    telemetry: {
      challengeId: challenge.id,
      startedAt: Date.now(),
      toolsUsed: [],
      commandCount: 0,
      hintsUsed: 0,
      aiMessages: [],
      solved: false,
      wrongAttempts: 0,
    },
  };
}

export function currentShell(state: EngineState): ShellSession {
  return state.shells[state.shells.length - 1];
}

export function promptString(state: EngineState): string {
  const s = currentShell(state);
  if (!s.host) return `┌──(root㉿kali)-[${s.cwd}]\n└─# `;
  const sym = s.root ? "#" : "$";
  const hn = s.host.hostname ?? s.host.ip;
  return `${s.user}@${hn}:${s.cwd}${sym} `;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function findHost(state: EngineState, target: string): VHost | undefined {
  return state.challenge.env.hosts.find((h) => h.ip === target || h.hostname === target);
}

function recordTool(state: EngineState, tool: string) {
  if (!state.telemetry.toolsUsed.includes(tool)) {
    state.telemetry.toolsUsed.push(tool);
  }
}

function ok(output: string): CommandResult {
  return { output, kind: "output" };
}
function err(output: string): CommandResult {
  return { output, kind: "error" };
}

/* ── Pipe execution ──────────────────────────────────────────── */

function executePipe(state: EngineState, line: string): CommandResult {
  // Split by pipe, but respect quoted strings
  const segments: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      current += ch;
      if (ch === quoteChar) inQuote = false;
    } else if (ch === "'" || ch === '"') {
      inQuote = true;
      quoteChar = ch;
      current += ch;
    } else if (ch === "|") {
      segments.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  segments.push(current.trim());

  if (segments.length < 2) return ok(line);

  let input = "";

  for (const segment of segments) {
    const parts = tokenize(segment);
    const cmd = parts[0];
    const args = parts.slice(1);

    // Process pipe commands with input
    const result = executePipeSegment(state, cmd, args, input);
    if (result.kind === "error") return result;
    input = result.output;
  }

  return ok(input);
}

function executePipeSegment(
  state: EngineState,
  cmd: string,
  args: string[],
  stdin: string,
): CommandResult {
  recordTool(state, cmd);
  const segment = [cmd, ...args].join(" ");

  switch (cmd) {
    case "cat":
    case "type":
    case "more": {
      // cat with stdin or file
      const file = args.find((a) => !a.startsWith("-"));
      if (file) {
        const s = currentShell(state);
        const fs = s.host ? (s.host.fs ?? {}) : state.localFs;
        const resolved = resolvePath(s.cwd, file);
        let content = fs[file] ?? fs[resolved];
        if (content === undefined) {
          const hit = Object.entries(fs).find(([p]) => p.endsWith("/" + file) || p === file);
          if (hit) content = hit[1];
        }
        return ok(content ?? `cat: ${file}: No such file or directory`);
      }
      return ok(stdin);
    }
    case "grep": {
      const pattern = args.find((a) => !a.startsWith("-"));
      if (!pattern) return err("grep: pattern required");
      const lines = stdin.split("\n");
      const invert = args.includes("-v");
      const caseInsensitive = args.includes("-i");
      const matched = lines.filter((line) => {
        const testLine = caseInsensitive ? line.toLowerCase() : line;
        const testPattern = caseInsensitive ? pattern.toLowerCase() : pattern;
        const matches = testLine.includes(testPattern);
        return invert ? !matches : matches;
      });
      return ok(matched.join("\n"));
    }
    case "wc": {
      const lines = stdin.split("\n").length;
      const words = stdin.split(/\s+/).filter(Boolean).length;
      const chars = stdin.length;
      if (args.includes("-l")) return ok(String(lines));
      if (args.includes("-w")) return ok(String(words));
      if (args.includes("-c")) return ok(String(chars));
      return ok(`  ${lines}  ${words} ${chars}`);
    }
    case "head": {
      const n = args.includes("-n") ? parseInt(args[args.indexOf("-n") + 1]) || 10 : 10;
      return ok(stdin.split("\n").slice(0, n).join("\n"));
    }
    case "tail": {
      const n = args.includes("-n") ? parseInt(args[args.indexOf("-n") + 1]) || 10 : 10;
      const lines = stdin.split("\n");
      return ok(lines.slice(-n).join("\n"));
    }
    case "sort": {
      const lines = stdin.split("\n");
      if (args.includes("-r")) return ok(lines.sort().reverse().join("\n"));
      return ok(lines.sort().join("\n"));
    }
    case "uniq": {
      const lines = stdin.split("\n");
      return ok([...new Set(lines)].join("\n"));
    }
    case "tr": {
      // Basic tr: tr 'A-Z' 'a-z'
      if (args.length >= 2) {
        const from = stripQuotes(args[0]);
        const to = stripQuotes(args[1]);
        let result = stdin;
        for (let i = 0; i < from.length && i < to.length; i++) {
          result = result.split(from[i]).join(to[i]);
        }
        return ok(result);
      }
      return ok(stdin);
    }
    case "base64": {
      if (args.includes("-d") || args.includes("--decode")) {
        try {
          return ok(b64decode(stdin));
        } catch {
          return err("base64: invalid input");
        }
      }
      return ok(b64encode(stdin));
    }
    case "md5sum":
    case "sha256sum":
    case "sha1sum": {
      // Simulate hash output
      const hash = simpleHash(stdin, cmd === "md5sum" ? 32 : cmd === "sha1sum" ? 40 : 64);
      return ok(`${hash}  -`);
    }
    case "xxd": {
      const hex = Array.from(stdin.slice(0, 32))
        .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(" ");
      return ok(hex);
    }
    case "rev": {
      return ok(
        stdin
          .split("\n")
          .map((l) => l.split("").reverse().join(""))
          .join("\n"),
      );
    }
    case "cut": {
      // cut -d':' -f1
      const delim = args.includes("-d") ? stripQuotes(args[args.indexOf("-d") + 1]) : "\t";
      const field = args.includes("-f") ? parseInt(args[args.indexOf("-f") + 1]) || 1 : 1;
      const lines = stdin.split("\n").map((line) => {
        const parts = line.split(delim);
        return parts[field - 1] ?? "";
      });
      return ok(lines.join("\n"));
    }
    case "awk": {
      // Simple awk: awk '{print $1}'
      const fieldMatch = /\{print\s+\$(\d+)\}/.exec(segment);
      if (fieldMatch) {
        const field = parseInt(fieldMatch[1]);
        const lines = stdin.split("\n").map((line) => {
          const parts = line.split(/\s+/);
          return parts[field - 1] ?? "";
        });
        return ok(lines.join("\n"));
      }
      return ok(stdin);
    }
    case "sed": {
      // Simple sed: sed 's/old/new/g'
      const sedMatch = /^s\/(.+)\/(.+)\/g?$/.exec(stripQuotes(args[0] ?? ""));
      if (sedMatch) {
        const [, from, to] = sedMatch;
        return ok(stdin.split(from).join(to));
      }
      return ok(stdin);
    }
    case "echo": {
      // echo with stdin: just return stdin or args
      if (stdin && args.length === 0) return ok(stdin);
      return ok(stripQuotes(args.join(" ")));
    }
    case "tee": {
      // tee: output to file and stdout
      const file = args.find((a) => !a.startsWith("-"));
      if (file) {
        const s = currentShell(state);
        const fs = s.host ? (s.host.fs ?? {}) : state.localFs;
        const path = resolvePath(s.cwd, file);
        fs[path] = stdin;
      }
      return ok(stdin);
    }
    default: {
      // Unknown command in pipe - try to execute normally but pass stdin
      const parts = [cmd, ...args];
      return execute(state, parts.join(" "));
    }
  }
}

function simpleHash(input: string, length: number): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(length, "0");
  return hex.slice(0, length).padEnd(length, "0");
}

/* ── Main dispatch ───────────────────────────────────────────── */

export function execute(state: EngineState, raw: string): CommandResult {
  const line = raw.trim();
  if (!line) return ok("");

  state.telemetry.commandCount += 1;

  // Handle pipes
  if (line.includes("|")) {
    return executePipe(state, line);
  }

  const parts = tokenize(line);
  const cmd = parts[0];
  const args = parts.slice(1);

  recordTool(state, cmd);

  switch (cmd) {
    case "help":
      return cmdHelp();
    case "clear":
      return { output: "__CLEAR__", kind: "system" };
    case "whoami":
      return ok(currentShell(state).user);
    case "id": {
      const s = currentShell(state);
      return cmdId(state, s);
    }
    case "ls":
    case "dir":
      return cmdLs(state, args);
    case "pwd":
      return ok(currentShell(state).cwd);
    case "cd":
      return cmdCd(state, args);
    case "cat":
    case "type":
    case "more":
      return cmdCat(state, args);
    case "uname":
      return cmdUname(state, args);
    case "ip":
    case "ifconfig":
      return cmdIp(state);
    case "nmap":
      return cmdNmap(state, args);
    case "ping":
      return cmdPing(state, args);
    case "curl":
    case "wget":
      return cmdCurl(state, args);
    case "gobuster":
    case "dirb":
    case "ffuf":
    case "feroxbuster":
      return cmdGobuster(state, args);
    case "nc":
    case "ncat":
    case "netcat":
      return cmdNetcat(state, args);
    case "ssh":
      return cmdSsh(state, args);
    case "ftp":
      return cmdFtp(state, args);
    case "hydra":
      return cmdHydra(state, args);
    case "smbclient":
    case "enum4linux":
    case "smbmap":
      return cmdSmb(state, args, cmd);
    case "sudo":
      return cmdSudo(state, args);
    case "find":
      return cmdFind(state, args);
    case "base64":
      return cmdBase64(state, args);
    case "echo":
      return cmdEcho(state, args);
    case "tr":
      return cmdTr(state, args);
    case "rot13":
      return cmdRot13(state, args);
    case "hashid":
    case "hash-identifier":
      return cmdHashId(state, args);
    case "john":
    case "hashcat":
      return cmdCrack(state, args, cmd);
    case "zip2john":
      return cmdZip2John(state, args);
    case "unzip":
      return cmdUnzip(state, args);
    case "strings":
      return cmdStrings(state, args);
    case "steghide":
      return cmdSteghide(state, args);
    case "binwalk":
      return cmdBinwalk(state, args);
    case "exiftool":
      return cmdExiftool(state, args);
    case "searchsploit":
      return cmdSearchsploit(state, args);
    case "mysql":
      return cmdMysql(state, args);
    case "docker":
      return cmdDocker(state, args);
    case "evil-winrm":
      return cmdWinrm(state, args);
    case "python3":
    case "python":
      return cmdPython(state, args);
    case "gcc":
    case "g++":
      return cmdGcc(state, args);
    case "chmod":
    case "chown":
      return ok("");
    case "exit":
    case "logout":
      return cmdExit(state);
    case "msfconsole":
    case "metasploit":
      return ok(
        "msfconsole is limited in simulation mode. Use nmap, curl, nc, hydra, ssh and other tools in this sandbox.",
      );
    case "ask-ai":
    case "hint":
      return {
        kind: "ai-hint",
        output: args.join(" ") || "I'm stuck. Give me a hint.",
      } as CommandResult;
    default:
      if (cmd.startsWith("./") || cmd.startsWith("/")) {
        return cmdExec(state, cmd, args);
      }
      return err(`${cmd}: command not found. Use 'help' to see available tools.`);
  }
}

/* ── Tokenizer (respects simple quotes) ──────────────────────── */

function tokenize(line: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    out.push(m[1] ?? m[2] ?? m[3]);
  }
  return out;
}

/* ── help ────────────────────────────────────────────────────── */

function cmdHelp(): CommandResult {
  return {
    kind: "system",
    output: `CyberAI Kali — available tools (sandbox):

  RECON       nmap, ping, ip/ifconfig
  WEB         curl, wget, gobuster/dirb/ffuf
  NETWORK     nc/ncat, smbclient, enum4linux
  ACCESS      ssh, ftp, hydra, evil-winrm, mysql, docker
  PRIVESC     sudo, find, searchsploit, uname
  CRYPTO      base64, tr, rot13, echo
  PASSWORD    hashid, john, hashcat, zip2john, unzip
  FORENSICS   strings, steghide, binwalk, exiftool
  FILES       ls, cd, pwd, cat, chmod
  SHELL       whoami, id, clear, exit
  AI         ask-ai, hint — get contextual guidance from CyberAI Mentor

  Once you find the flag, use the "Submit Flag" button.`,
  };
}

/* ── id / whoami ─────────────────────────────────────────────── */

function cmdId(state: EngineState, s: ShellSession): CommandResult {
  if (!s.host) return ok("uid=0(root) gid=0(root) groups=0(root)");
  // Docker challenge: surface the docker group
  const groupsFile = s.host.fs?.[`/home/${s.user}/groups.txt`];
  if (groupsFile && groupsFile.includes("docker")) {
    return ok(`uid=1000(${s.user}) gid=1000(${s.user}) groups=1000(${s.user}),998(docker)`);
  }
  if (s.root) return ok("uid=0(root) gid=0(root) groups=0(root)");
  return ok(`uid=1000(${s.user}) gid=1000(${s.user}) groups=1000(${s.user})`);
}

/* ── uname ───────────────────────────────────────────────────── */

function cmdUname(state: EngineState, args: string[]): CommandResult {
  const s = currentShell(state);
  if (!s.host) return ok("Linux kali 6.6.9-amd64 #1 SMP x86_64 GNU/Linux");
  const ver = s.host.fs?.["/proc/version"] ?? s.host.os ?? "Linux";
  if (args.includes("-r") || args.includes("-a")) {
    const m = ver.match(/(\d+\.\d+\.\d+[\w.-]*)/);
    return ok(m ? m[1] : "5.15.0-generic");
  }
  return ok("Linux");
}

/* ── ip / ifconfig ───────────────────────────────────────────── */

function cmdIp(state: EngineState): CommandResult {
  const s = currentShell(state);
  if (!s.host) {
    return ok("eth0: inet 10.10.14.2/24  (Kali attacker)\nlo:   inet 127.0.0.1/8");
  }
  const net = s.host.fs?.["/home/" + s.user + "/network.txt"];
  if (net) return ok(net);
  // Dual-homed pivot host
  if (s.host.fs && Object.values(s.host.fs).some((v) => v.includes("172.16"))) {
    return ok("eth0: 10.10.30.10/24\neth1: 172.16.0.5/24 (Internal Network)");
  }
  return ok(`eth0: inet ${s.host.ip}/24`);
}

/* ── ls ──────────────────────────────────────────────────────── */

function cmdLs(state: EngineState, args: string[]): CommandResult {
  const s = currentShell(state);
  const fs = s.host ? (s.host.fs ?? {}) : state.localFs;
  const dir = args.find((a) => !a.startsWith("-")) ?? s.cwd;
  const norm = dir.endsWith("/") ? dir : dir + "/";

  const entries = new Set<string>();
  for (const path of Object.keys(fs)) {
    if (path.startsWith(norm)) {
      const rest = path.slice(norm.length).split("/")[0];
      if (rest) entries.add(rest);
    }
  }

  if (entries.size === 0) return ok("(empty)");
  return ok([...entries].sort().join("  "));
}

/* ── cd ──────────────────────────────────────────────────────── */

function cmdCd(state: EngineState, args: string[]): CommandResult {
  const s = currentShell(state);
  const target = args[0] ?? (s.host ? `/home/${s.user}` : "/root");
  if (target === "..") {
    const segs = s.cwd.split("/").filter(Boolean);
    segs.pop();
    s.cwd = "/" + segs.join("/");
    if (s.cwd === "/") s.cwd = "/";
  } else if (target.startsWith("/")) {
    s.cwd = target;
  } else {
    s.cwd = (s.cwd === "/" ? "" : s.cwd) + "/" + target;
  }
  return ok("");
}

/* ── cat ─────────────────────────────────────────────────────── */

function cmdCat(state: EngineState, args: string[]): CommandResult {
  const file = args.find((a) => !a.startsWith("-"));
  if (!file) return err("cat: filename required");
  const s = currentShell(state);
  const fs = s.host ? (s.host.fs ?? {}) : state.localFs;

  const resolved = resolvePath(s.cwd, file);
  // Try exact, then resolved, then basename match
  let content = fs[file] ?? fs[resolved];
  if (content === undefined) {
    const hit = Object.entries(fs).find(([p]) => p.endsWith("/" + file) || p === file);
    if (hit) content = hit[1];
  }

  if (content === undefined) {
    return err(`cat: ${file}: No such file or directory`);
  }
  return ok(content);
}

function resolvePath(cwd: string, file: string): string {
  if (file.startsWith("/")) return file;
  return (cwd === "/" ? "" : cwd) + "/" + file;
}

/* ── nmap ────────────────────────────────────────────────────── */

function cmdNmap(state: EngineState, args: string[]): CommandResult {
  const target = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a) || findHost(state, a));
  if (!target) return err("nmap: target IP required. Example: nmap 10.10.10.5");

  const host = findHost(state, target);
  if (!host) {
    return ok(
      `Starting Nmap 7.94 ...\nNote: Host seems down or filtered (0 hosts up).\nThis IP does not exist in the sandbox network.`,
    );
  }

  const allPorts = args.includes("-p-");
  const sv = args.includes("-sV") || args.includes("-sC") || args.includes("-A");

  const ports = host.ports.filter((p) => p.state !== "closed");
  const shown = allPorts ? ports : ports.filter((p) => p.port < 10000 || sv);

  const lines = shown.map((p) => {
    const state_ = p.state ?? "open";
    const svc = p.service.padEnd(14);
    const ver = sv && p.version ? p.version : "";
    return `${String(p.port).padEnd(9)}${state_.padEnd(8)}${svc}${ver}`;
  });

  return ok(
    `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for ${host.hostname ?? host.ip} (${host.ip})
Host is up (0.012s latency).
${allPorts ? "" : "Not shown: closed ports\n"}PORT     STATE   SERVICE       ${sv ? "VERSION" : ""}
${lines.join("\n")}
${host.os && sv ? `OS details: ${host.os}` : ""}

Nmap done: 1 IP address (1 host up) scanned.`,
  );
}

/* ── ping ────────────────────────────────────────────────────── */

function cmdPing(state: EngineState, args: string[]): CommandResult {
  const target = args.find((a) => !a.startsWith("-"));
  const host = target ? findHost(state, target) : undefined;
  if (!host) return err(`ping: ${target ?? "host"}: unreachable (not in sandbox network)`);
  return ok(
    `PING ${host.ip}: 64 bytes from ${host.ip}: icmp_seq=1 ttl=64 time=0.4 ms\n64 bytes from ${host.ip}: icmp_seq=2 ttl=64 time=0.3 ms\n--- ${host.ip} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss`,
  );
}

/* ── curl / wget ─────────────────────────────────────────────── */

function cmdCurl(state: EngineState, args: string[]): CommandResult {
  const urlArg = args.find(
    (a) => a.startsWith("http") || a.includes("/") || /\d+\.\d+\.\d+\.\d+/.test(a),
  );
  if (!urlArg) return err("curl: URL required. Example: curl http://10.10.10.5/");

  const verbose = args.includes("-v");

  // External domain rabbit hole traps (Telegram Bot API, Discord webhook)
  const extResult = handleExternalCurl(urlArg, verbose);
  if (extResult) return extResult;

  const cookieArg = grabFlag(args, "-b");

  const { host, path } = parseUrl(state, urlArg);
  if (!host) return err(`curl: (6) Could not resolve ${urlArg} (not in sandbox network)`);
  if (!host.web) return err(`curl: (7) Could not connect to ${host.ip} — no HTTP service`);

  state.compromised.add(host.ip);

  // Direct route match (including query)
  const route = host.web.routes[path];

  // Cookie-tampering challenges: an admin cookie unlocks protected route
  if (route?.protected) {
    const unlocked = checkProtectedAccess(host, path, args, cookieArg);
    if (!unlocked) {
      // Rabbit hole: simulate correct credentials but deny access
      const fakePassword = generateFakePassword();
      return ok(
        renderHttp(host, path, 200, route.body, route.headers, verbose) +
          `\n\n[Note: this path is protected — correct parameter/cookie/credential required.]\n[!] Fake password: ${fakePassword} (this won't work anywhere)`,
      );
    }
  }

  if (!route) {
    // Path traversal / injection style direct matches already in routes
    return ok(
      verbose
        ? `> GET ${path} HTTP/1.1\n> Host: ${host.ip}\n< HTTP/1.1 404 Not Found\n\n404 Not Found`
        : "404 Not Found",
    );
  }

  return ok(renderHttp(host, path, route.status, route.body, route.headers, verbose));
}

function renderHttp(
  host: VHost,
  path: string,
  status: number,
  body: string,
  headers: Record<string, string> | undefined,
  verbose: boolean,
): string {
  if (!verbose) return body;
  const hdrLines = Object.entries(headers ?? {})
    .map(([k, v]) => `< ${k}: ${v}`)
    .join("\n");
  return `*   Trying ${host.ip}...
> GET ${path} HTTP/1.1
> Host: ${host.hostname ?? host.ip}
> User-Agent: curl/8.0
>
< HTTP/1.1 ${status} ${status === 200 ? "OK" : status === 403 ? "Forbidden" : "Found"}
< Server: ${host.web?.server ?? "unknown"}
${hdrLines}
<
${body}`;
}

function checkProtectedAccess(
  host: VHost,
  path: string,
  args: string[],
  cookie: string | undefined,
): boolean {
  // Cookie role=admin
  if (cookie && /role\s*=\s*admin/i.test(cookie)) return true;
  // SQLi auth bypass on login -> dashboard
  const data = grabFlag(args, "-d") ?? grabFlag(args, "--data") ?? "";
  if (/('|--|or\s+1=1|or\s+'1'='1)/i.test(data)) return true;
  return false;
}

function parseUrl(state: EngineState, url: string): { host?: VHost; path: string } {
  const clean = url.replace(/^https?:\/\//, "");
  const slash = clean.indexOf("/");
  const hostPart = slash >= 0 ? clean.slice(0, slash) : clean;
  let path = slash >= 0 ? clean.slice(slash) : "/";
  const ip = hostPart.split(":")[0];
  const host = findHost(state, ip);
  if (!path) path = "/";
  return { host, path };
}

function grabFlag(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return undefined;
}

/* ── External domain rabbit hole traps ───────────────────────── */

const TELEGRAM_BOT_RE = /\/bot(\d+:[\w-]+)\//;

function handleExternalCurl(url: string, verbose: boolean): CommandResult | null {
  const domain = extractDomain(url);
  if (!domain) return null;
  const path = extractPath(url);

  if (domain === "api.telegram.org") return telegramCurlResponse(path, verbose);
  if (domain === "discord.com" || domain === "discordapp.com")
    return discordCurlResponse(path, verbose);
  return null;
}

function extractDomain(url: string): string | null {
  const m = url.match(/^https?:\/\/([^/:?#]+)/);
  return m ? m[1].toLowerCase() : null;
}

function extractPath(url: string): string {
  const s = url.indexOf("/", url.indexOf("://") + 3);
  if (s === -1) return "/";
  const q = url.indexOf("?", s);
  return q >= 0 ? url.slice(s, q) : url.slice(s);
}

function telegramCurlResponse(path: string, verbose: boolean): CommandResult {
  // /bot<token>/getMe — returns fake bot info
  const getMe = path.match(TELEGRAM_BOT_RE) && path.endsWith("/getMe");
  if (getMe) {
    const body = JSON.stringify(
      {
        ok: true,
        result: {
          id: "7291847362",
          is_bot: true,
          first_name: "Phantom Leak Bot",
          username: "Phantom_Leak_Bot",
          can_join_groups: false,
          can_read_all_group_messages: false,
        },
      },
      null,
      2,
    );
    if (!verbose) return ok(body);
    return ok(
      `*   Trying 149.154.167.220:443...
> POST /bot${path.split("/bot")[1]} HTTP/1.1
> Host: api.telegram.org
> User-Agent: curl/8.0
>
< HTTP/1.1 200 OK
< Server: nginx/1.24.0
< Content-Type: application/json
<
${body}`,
    );
  }

  // Any /bot<token>/... command → 401 token expired
  if (TELEGRAM_BOT_RE.test(path)) {
    const body = JSON.stringify(
      {
        ok: false,
        error_code: 401,
        description: "Unauthorized: token expired or revoked",
      },
      null,
      2,
    );
    if (!verbose) return ok(body);
    return ok(
      `*   Trying 149.154.167.220:443...
> POST ${path} HTTP/1.1
> Host: api.telegram.org
>
< HTTP/1.1 401 Unauthorized
< Content-Type: application/json
<
${body}`,
    );
  }

  return ok(
    verbose
      ? `*   Trying 149.154.167.220:443...
> GET ${path} HTTP/1.1
> Host: api.telegram.org
>
< HTTP/1.1 404 Not Found`
      : "404 Not Found",
  );
}

function discordCurlResponse(path: string, verbose: boolean): CommandResult {
  // /api/webhooks/<id>/<token> — 404 Unknown Webhook
  if (/^\/api\/webhooks\//.test(path)) {
    const body = JSON.stringify({ message: "Unknown Webhook", code: 10015 }, null, 2);
    if (!verbose) return ok(body);
    return ok(
      `*   Trying 162.159.128.233:443...
> POST ${path} HTTP/1.1
> Host: discord.com
>
< HTTP/1.1 404 Not Found
< Content-Type: application/json
<
${body}`,
    );
  }

  return ok(
    verbose
      ? `*   Trying 162.159.128.233:443...
> GET ${path} HTTP/1.1
> Host: discord.com
>
< HTTP/1.1 404 Not Found`
      : "404 Not Found",
  );
}

/* ── gobuster / dirb ─────────────────────────────────────────── */

function cmdGobuster(state: EngineState, args: string[]): CommandResult {
  const urlArg = args.find((a) => a.startsWith("http") || /\d+\.\d+\.\d+\.\d+/.test(a));
  if (!urlArg) return err("gobuster: -u <url> required");
  const { host } = parseUrl(state, urlArg);
  if (!host || !host.web) return err("gobuster: target web server not found");

  state.compromised.add(host.ip);

  const found = host.web.discoverablePaths ?? Object.keys(host.web.routes);
  const lines = found
    .filter((p) => !p.includes("?"))
    .map((p) => {
      const r = host.web!.routes[p];
      const status = r ? r.status : 200;
      return `${p.padEnd(28)} (Status: ${status})`;
    });

  return ok(
    `===============================================================
Gobuster v3.6
===============================================================
[+] Url:            ${urlArg}
[+] Wordlist:       /usr/share/wordlists/dirb/common.txt
[+] Threads:        10
===============================================================
${lines.join("\n")}
===============================================================
Finished — ${lines.length} paths found.`,
  );
}

/* ── netcat ──────────────────────────────────────────────────── */

function cmdNetcat(state: EngineState, args: string[]): CommandResult {
  const ipArg = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a) || findHost(state, a));
  const portArg = args.find((a) => /^\d+$/.test(a));
  if (!ipArg || !portArg) return err("nc: usage: nc <ip> <port>");

  const host = findHost(state, ipArg);
  if (!host) return err(`nc: could not connect to ${ipArg} (not in sandbox network)`);

  const port = host.ports.find((p) => p.port === Number(portArg));
  if (!port || port.state === "closed") {
    return err(`nc: ${ipArg}:${portArg} — connection refused (port closed)`);
  }

  state.compromised.add(host.ip);

  if (port.banner) {
    return ok(`Connected to ${ipArg}:${portArg}\n${port.banner}`);
  }
  if (port.service === "http") {
    return ok(`Connected to ${ipArg}:${portArg}\n(HTTP — it is recommended to use curl)`);
  }
  return ok(`Connected to ${ipArg}:${portArg}\n${port.service} ${port.version ?? ""}`);
}

/* ── ssh ─────────────────────────────────────────────────────── */

function cmdSsh(state: EngineState, args: string[]): CommandResult {
  // forms: ssh user@ip  |  ssh -i key user@ip
  const userHost = args.find((a) => a.includes("@"));
  const usesKey = args.includes("-i");
  if (!userHost) return err("ssh: usage: ssh user@host");

  const [user, ipRaw] = userHost.split("@");
  const host = findHost(state, ipRaw);
  if (!host)
    return err(`ssh: connect to host ${ipRaw}: connection failed (not in sandbox network)`);

  const sshPort = host.ports.find((p) => p.port === 22 && p.service === "ssh");
  if (!sshPort) return err(`ssh: connect to host ${ipRaw} port 22: connection refused`);

  const cred = host.credentials?.find((c) => c.service === "ssh" && c.username === user);

  // Key-based auth (leaked key challenges store password as __KEY__)
  if (usesKey) {
    if (cred && cred.password === "__KEY__") {
      return openShell(state, host, user, false);
    }
    return err(`ssh: ${user}@${ipRaw}: Permission denied (publickey). Correct key required.`);
  }

  if (!cred) {
    // Rabbit hole: simulate correct password but deny access
    const fakePassword = generateFakePassword();
    return err(
      `${user}@${ipRaw}'s password: \nPermission denied. This user does not exist or password is incorrect.\n(Tip: find the password with hydra or use the correct credential.)`,
    );
  }

  // Password is known from a prior step; we accept the correct credential.
  return openShell(state, host, user, false);
}

function openShell(state: EngineState, host: VHost, user: string, root: boolean): CommandResult {
  state.compromised.add(host.ip);
  state.shells.push({
    host,
    user,
    root,
    cwd: root ? "/root" : `/home/${user}`,
  });
  return {
    promptChanged: true,
    kind: "system",
    output: `Successfully connected to ${user}@${host.hostname ?? host.ip}.
Linux ${host.hostname ?? host.ip} ${host.os ?? ""}
Last login: ${new Date().toUTCString()}

Continue with 'ls', 'cat', 'sudo -l', 'find / -perm -4000'.`,
  };
}

/* ── ftp ─────────────────────────────────────────────────────── */

function cmdFtp(state: EngineState, args: string[]): CommandResult {
  const ipRaw = args.find((a) => /^\d+\.\d+\.\d+\.\d+$/.test(a) || findHost(state, a));
  if (!ipRaw) return err("ftp: usage: ftp <ip>");
  const host = findHost(state, ipRaw);
  if (!host) return err(`ftp: could not connect to ${ipRaw} (not in sandbox network)`);

  const ftpPort = host.ports.find((p) => p.service === "ftp");
  if (!ftpPort) return err(`ftp: ${ipRaw} — FTP service not available`);

  const anon = host.credentials?.find((c) => c.service === "ftp" && c.username === "anonymous");
  state.compromised.add(host.ip);

  const files = Object.keys(host.fs ?? {})
    .filter((p) => p.startsWith("/ftp/"))
    .map((p) => p.slice("/ftp/".length));

  if (anon) {
    return ok(
      `Connected to ${ipRaw}.\n${ftpPort.banner ?? "220 FTP ready"}\n` +
        `Name: anonymous\n331 Please specify the password.\nPassword: \n230 Login successful.\nftp> ls\n${files.join("\n")}\n\nTo read files: get <file> then cat /ftp/<file>`,
    );
  }

  // Rabbit hole: simulate correct credentials but deny access
  const fakePassword = generateFakePassword();
  return ok(
    `Connected to ${ipRaw}.\n${ftpPort.banner ?? "220 FTP ready"}\n` +
      `Name: admin\n331 Please specify the password.\nPassword: \n530 Login incorrect.\n[!] Note: This password won't work anywhere — this is a fake result.`,
  );
}

/* ── hydra ───────────────────────────────────────────────────── */

function cmdHydra(state: EngineState, args: string[]): CommandResult {
  const login = grabFlag(args, "-l") ?? grabFlag(args, "-L");
  const svcArg = args.find((a) => a.includes("://"));
  if (!svcArg) return err("hydra: usage: hydra -l user -P wordlist ssh://<ip>");

  const [svc, ip] = svcArg.split("://");
  const host = findHost(state, ip);
  if (!host) return err(`hydra: ${ip} not found (not in sandbox network)`);

  const cred = host.credentials?.find(
    (c) => c.service === (svc as never) && (!login || c.username === login),
  );

  // Rabbit hole: return fake credentials that look real but don't work
  if (!cred || cred.password === "__KEY__") {
    // Generate a fake but realistic-looking password
    const fakePassword = generateFakePassword();
    return ok(
      `Hydra v9.5 starting...
[DATA] max 16 tasks, attacking ${svc}://${ip}
[STATUS] 2104 tries/min
[${host.ports.find((p) => p.service === svc)?.port ?? 22}][${svc}] host: ${ip}   login: ${login ?? "admin"}   password: ${fakePassword}
1 of 1 target successfully completed, 1 valid password found.

[+] Found: ${login ?? "admin"}:${fakePassword}
[!] Note: This password won't work anywhere — this is a fake result.`,
    );
  }

  return ok(
    `Hydra v9.5 starting...
[DATA] max 16 tasks, attacking ${svc}://${ip}
[STATUS] 2104 tries/min
[${host.ports.find((p) => p.service === svc)?.port ?? 22}][${svc}] host: ${ip}   login: ${cred.username}   password: ${cred.password}
1 of 1 target successfully completed, 1 valid password found.

[+] Found: ${cred.username}:${cred.password}`,
  );
}

/* ── Fake password generator for rabbit holes ────────────────── */

function generateFakePassword(): string {
  const adjectives = ["Phantom", "Shadow", "Dark", "Cyber", "Neon", "Viper", "Ghost", "Iron"];
  const nouns = ["Wolf", "Snake", "Eagle", "Dragon", "Tiger", "Bear", "Falcon", "Panther"];
  const suffixes = ["2024", "Secure", "Master", "Admin", "Root", "7421", "X99", "V2"];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${adj}${noun}${suffix}`;
}

/* ── smb ─────────────────────────────────────────────────────── */

function cmdSmb(state: EngineState, args: string[], tool: string): CommandResult {
  const ipRaw =
    args.find((a) => /\d+\.\d+\.\d+\.\d+/.test(a))?.match(/\d+\.\d+\.\d+\.\d+/)?.[0] ??
    args.find((a) => findHost(state, a));
  if (!ipRaw) return err(`${tool}: target IP required`);
  const host = findHost(state, ipRaw);
  if (!host) return err(`${tool}: ${ipRaw} not found (not in sandbox network)`);

  const hasSmb = host.ports.some((p) => p.port === 445 || p.port === 139);
  if (!hasSmb) return err(`${tool}: ${ipRaw} — SMB service not available`);

  state.compromised.add(host.ip);

  const shares = new Set<string>();
  for (const path of Object.keys(host.fs ?? {})) {
    const m = path.match(/^\/\/([^/]+)\//);
    if (m) shares.add(m[1]);
  }

  // Listing shares (-L or enum4linux)
  const listing = args.includes("-L") || tool === "enum4linux" || tool === "smbmap";
  // Accessing a specific share: //ip/share
  const shareArg = args.find((a) => a.startsWith("//"));

  if (shareArg) {
    const shareName = shareArg.split("/").filter(Boolean).pop();
    const files = Object.keys(host.fs ?? {})
      .filter((p) => p.startsWith(`//${shareName}/`))
      .map((p) => p.slice(`//${shareName}/`.length));
    if (files.length === 0) return ok(`tree connect failed: no such share or permission denied`);

    // Rabbit hole: simulate correct credentials but deny access
    const fakePassword = generateFakePassword();
    return ok(
      `smbclient ${tool} //${ipRaw}/${shareName} -U ${args.find((a) => a.includes("-U")) ?? "anonymous"}%${fakePassword}
Enter ${host.credentials?.[0]?.username ?? "anonymous"}'s password: 
tree connect failed: NT_STATUS_ACCESS_DENIED
[!] Note: This password won't work anywhere — this is a fake result.`,
    );
  }

  if (listing) {
    return ok(
      `Sharename       Type      Comment\n---------       ----      -------\n${[...shares]
        .map((s) => `${s.padEnd(16)}Disk`)
        .join("\n")}\n\nNull session successful. Access share: smbclient //${ipRaw}/<share> -N`,
    );
  }

  return ok(`${tool}: list shares with -L or connect to //${ipRaw}/<share>.`);
}

/* ── sudo ────────────────────────────────────────────────────── */

function cmdSudo(state: EngineState, args: string[]): CommandResult {
  const s = currentShell(state);
  if (!s.host) return ok("(already root — running as root on the local Kali box)");

  if (args[0] === "-l") {
    const sudoers =
      s.host.fs?.[`/etc/sudoers.d/${s.user}`] ??
      Object.entries(s.host.fs ?? {}).find(([p]) => p.includes("sudoers"))?.[1];
    if (sudoers) {
      const binMatch = sudoers.match(/NOPASSWD:\s*(\S+)/);
      const bin = binMatch ? binMatch[1] : "?";
      return ok(
        `Matching Defaults entries for ${s.user}:\n\nUser ${s.user} may run the following commands:\n    (root) NOPASSWD: ${bin}\n\n[Check GTFOBins: ${bin.split("/").pop()}]`,
      );
    }
    return ok(`User ${s.user} may not run any commands without a password.`);
  }

  // Rabbit hole: simulate correct credentials but deny access
  const fakePassword = generateFakePassword();

  // sudo <binary> ... -> if it matches the NOPASSWD bin and is GTFOBins-able, grant root
  const sudoers = s.host.fs?.[`/etc/sudoers.d/${s.user}`] ?? "";
  const binMatch = sudoers.match(/NOPASSWD:\s*(\S+)/);
  const allowedBin = binMatch ? binMatch[1].split("/").pop() : null;
  const calledBin = args[0]?.split("/").pop();

  if (allowedBin && calledBin === allowedBin) {
    // GTFOBins shell escape (find -exec, vim, etc.)
    if (args.some((a) => /(-exec|\/sh|\/bash|:!|shell)/.test(a)) || calledBin === "find") {
      s.root = true;
      s.cwd = "/root";
      return {
        kind: "system",
        promptChanged: true,
        output: `# GTFOBins shell escape successful.\nYou got root! Now: cat /root/root.txt`,
      };
    }
    return ok(
      `(root command executed. Use GTFOBins technique to get a shell, e.g.: sudo ${calledBin} . -exec /bin/sh \\;)`,
    );
  }

  return err(
    `Sorry, user ${s.user} may not run that command as root.\n[!] Fake password: ${fakePassword} (this won't work anywhere)`,
  );
}

/* ── find ────────────────────────────────────────────────────── */

function cmdFind(state: EngineState, args: string[]): CommandResult {
  const s = currentShell(state);
  // SUID search
  if (args.includes("-perm") && args.some((a) => a.includes("4000"))) {
    if (!s.host) return ok("/usr/bin/sudo\n/usr/bin/passwd\n(local Kali — standard SUID binaries)");
    const suid = Object.keys(s.host.fs ?? {}).filter((p) =>
      (s.host!.fs![p] ?? "").includes("SUID"),
    );
    const base = ["/usr/bin/sudo", "/usr/bin/passwd", "/usr/bin/mount", ...suid];
    const hint = suid.length ? `\n\n[!] Unusual SUID: ${suid.join(", ")} — check GTFOBins.` : "";
    return ok(base.join("\n") + hint);
  }
  return ok("(find: no results or arguments not supported)");
}

/* ── python3 / python (rabbit hole exploit simulation) ────────── */

function cmdPython(state: EngineState, args: string[]): CommandResult {
  const script = args.find(
    (a) => a.endsWith(".py") || a.endsWith(".sh") || (!a.startsWith("-") && !a.startsWith("--")),
  );
  if (!script)
    return ok(
      'Python 3.11.5 (default, Sep 11 2023, 08:19:27)\n[GCC 12.2.0] on linux\nType "help" for more information.',
    );

  if (/exploit|shell|rev|pwn|poc/.test(script)) {
    return simulateExploitRun(state, script);
  }
  return ok(
    `Python 3.11.5\n>>> ${script}\nTraceback (most recent call last):\n  File "<stdin>", line 1, in <module>\nNameError: name '${script.replace(/\.py$/, "")}' is not defined`,
  );
}

/* ── gcc / g++ (compile simulation) ──────────────────────────── */

function cmdGcc(state: EngineState, args: string[]): CommandResult {
  const source = args.find((a) => a.endsWith(".c") || a.endsWith(".cpp"));
  if (!source) return err("gcc: usage: gcc <source.c> -o <output>");

  const outIdx = args.indexOf("-o");
  const outName = outIdx >= 0 && args[outIdx + 1] ? args[outIdx + 1] : "a.out";

  // Mark the compiled binary as present in local FS
  const s = currentShell(state);
  const base = s.cwd === "/root" ? "" : "/root";
  state.localFs[`${base}/${outName}`] = "[COMPILED BINARY - executable]";

  return ok(
    `gcc ${source} -o ${outName}
${source}: In function 'main':
${source}:1:0: warning: ignoring return value of 'system' declared with attribute 'warn_unused_result'
    1 | int main() { system("/bin/sh"); return 0; }
      |              ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Compiled successfully: ${outName}`,
  );
}

/* ── Local executable (. /binary) ────────────────────────────── */

function cmdExec(state: EngineState, cmd: string, args: string[]): CommandResult {
  const bin = cmd.split("/").pop() || cmd;

  if (/^exploit|^shell|^rev|^pwn|^poc/.test(bin)) {
    return simulateExploitRun(state, cmd);
  }

  // Check existence in current filesystem
  const s = currentShell(state);
  const fs = s.host ? (s.host.fs ?? {}) : state.localFs;
  const exists = Object.keys(fs).some((p) => p.endsWith("/" + bin) || p === cmd);
  if (exists) return ok(`(file executed — exit code: 0)`);

  return err(`${cmd}: file not found or not executable`);
}

/* ── Exploit run simulation (rabbit hole) ────────────────────── */

function simulateExploitRun(state: EngineState, name: string): CommandResult {
  // Challenge-specific rabbit hole simulations
  if (state.challenge.id === "oscp-03-specter") {
    return ok(
      `[*] CVE-2023-1337 PoC — Specter CMS RCE
[*] Target: 10.10.40.20
[*] Checking CMS version... v4.2.1 (vulnerable)
[*] Uploading malicious plugin via admin panel...
[*] Plugin installed: wp_sec_audit.so
[*] Triggering payload on /wp-content/uploads/wp_sec_audit.so...
[*] Reverse shell connecting to 10.10.40.20:4444...
[!] Connection reset by peer — access denied.
[!] Target blocked outbound connections. This PoC is non-functional.
[*] Try a different CVE or exploitation technique.`,
    );
  }

  if (state.challenge.id === "oscp-05-nexus") {
    return ok(
      `[*] NEXUS Container Escape PoC
[*] Target: registry.nexus.corp:5000
[*] Exploiting Docker registry misconfiguration...
[*] Crafting malicious image layer with SUID payload...
[*] Pushing to registry...
[*] Attempting container breakout...
[!] ERROR: Connection reset by peer — access denied.
[!] This exploit path is blocked by AppArmor.
[*] Try a different privilege escalation technique.`,
    );
  }

  // Generic rabbit hole for any challenge
  return ok(
    `[*] Loading exploit module: ${name}
[*] Initializing payload...
[#####-------------------] 20%
[##########--------------] 45%
[###############---------] 68%
[####################----] 89%
[########################] 100%
[*] Sending payload...
[!] Connection reset by peer — access denied.
[!] This exploit path is blocked or non-functional.
[*] Try a different exploitation technique.`,
  );
}

/* ── base64 ──────────────────────────────────────────────────── */

function cmdBase64(state: EngineState, args: string[]): CommandResult {
  const decode = args.includes("-d") || args.includes("--decode");
  // value may come from echo pipe handled separately; here accept inline arg
  const val = args.find((a) => !a.startsWith("-"));
  if (!val) return err("base64: input required (or echo '...' | base64 -d)");
  try {
    if (decode) {
      return ok(b64decode(val));
    }
    return ok(b64encode(val));
  } catch {
    return err("base64: invalid input");
  }
}

function b64decode(s: string): string {
  return atob(s.replace(/\s/g, ""));
}
function b64encode(s: string): string {
  return btoa(s);
}

/* ── echo ──────────────────────────────────────────────────────── */

function cmdEcho(state: EngineState, args: string[]): CommandResult {
  return ok(stripQuotes(args.join(" ")));
}

function stripQuotes(s: string): string {
  return s.replace(/^['"]|['"]$/g, "");
}

/* ── tr / rot13 ──────────────────────────────────────────────── */

function cmdTr(state: EngineState, args: string[]): CommandResult {
  if (args.length < 2) return err("tr: missing operand\nUsage: tr 'set1' 'set2'");
  const set1 = stripQuotes(args[0]);
  const set2 = stripQuotes(args[1]);
  if (set1.length !== set2.length) return err("tr: set1 and set2 must have equal length");
  // Apply translation to stdin simulation (empty for now)
  return ok(`(tr: translation applied. echo 'text' | tr '${set1}' '${set2}')`);
}

function cmdRot13(state: EngineState, args: string[]): CommandResult {
  const val = args.join(" ");
  if (!val) return err("rot13: input required");
  return ok(rot13(stripQuotes(val)));
}

function rot13(s: string): string {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

/* ── hashid ──────────────────────────────────────────────────── */

function cmdHashId(state: EngineState, args: string[]): CommandResult {
  const val = args.find((a) => !a.startsWith("-"));
  if (!val) return err("hashid: hash required");
  const len = val.length;
  if (len === 32) return ok(`Analyzing '${val}'\n[+] MD5\n[+] NTLM`);
  if (len === 40) return ok(`Analyzing '${val}'\n[+] SHA-1`);
  if (len === 64) return ok(`Analyzing '${val}'\n[+] SHA-256`);
  if (val.startsWith("$1$")) return ok(`Analyzing '${val}'\n[+] MD5 Crypt`);
  return ok(`Analyzing '${val}'\n[+] Unknown / custom`);
}

/* ── john / hashcat ──────────────────────────────────────────── */

function cmdCrack(state: EngineState, args: string[], tool: string): CommandResult {
  // Find a hash file referenced, or a zip hash
  const fileArg = args.find((a) => a.endsWith(".txt") || a.endsWith(".hash"));
  const s = currentShell(state);
  const fs = s.host ? (s.host.fs ?? {}) : state.localFs;

  // Map known challenge hashes to cracked passwords
  const content = fileArg ? (fs[fileArg] ?? state.localFs[fileArg]) : undefined;

  // l1-09: MD5 0571749e2ac330a7455809c6b0e7af90 -> sunshine
  if (
    content?.includes("0571749e2ac330a7455809c6b0e7af90") ||
    state.challenge.id === "l1-09-hashid"
  ) {
    return ok(
      `${tool}: loaded 1 hash (raw-md5)\nProceeding with wordlist:rockyou.txt\nsunshine         (?)\n1 password cracked.\n\n[+] Cracked password: sunshine`,
    );
  }

  // zip hash
  if (state.challenge.id === "l2-06-zip-crack") {
    return ok(
      `${tool}: loaded 1 hash (PKZIP)\nProceeding with wordlist:rockyou.txt\ndragon           (secret.zip)\n1 password cracked.\n\n[+] ZIP password: dragon`,
    );
  }

  // Kerberoast / AD
  if (state.challenge.category === "network" && state.challenge.level === 3) {
    return ok(
      `${tool} -m 13100 starting...\n$krb5tgs$23$*sqlsvc*...:Summer2023!\nApproaching final keyspace...\n[+] Cracked: sqlsvc:Summer2023! (Domain Admin)`,
    );
  }

  // WAF challenge admin hash
  if (state.challenge.id === "l3-09-waf-bypass") {
    return ok(`${tool}: cracked\n$1$xyz$...:admin@123\n[+] admin password: admin@123`);
  }

  return ok(
    `${tool}: loaded hashes. Proceeding with wordlist...\n0 password cracked. (Hash not found or file incorrect — check with cat.)`,
  );
}

/* ── zip2john ────────────────────────────────────────────────── */

function cmdZip2John(state: EngineState, args: string[]): CommandResult {
  const f = args.find((a) => a.endsWith(".zip"));
  if (!f) return err("zip2john: .zip file required");
  state.localFs["/root/zip.hash"] = "secret.zip:$pkzip2$1*...*PKZIP-hash";
  return ok(
    `${f}:$pkzip2$1*2*...*hash  -> saved to zip.hash\n(Now: john --wordlist=rockyou.txt zip.hash)`,
  );
}

/* ── unzip ───────────────────────────────────────────────────── */

function cmdUnzip(state: EngineState, args: string[]): CommandResult {
  const f = args.find((a) => a.endsWith(".zip"));
  if (!f) return err("unzip: .zip file required");
  if (state.challenge.id === "l2-06-zip-crack") {
    state.localFs["/root/flag.txt"] = "CYBERAI{z1p_cr4ck3d_w1th_j0hn}";
    return ok(
      `Archive: ${f}\n[${f}] flag.txt password: \n inflating: flag.txt\n\nflag.txt extracted. Now: cat flag.txt`,
    );
  }
  return ok(`Archive: ${f}\n(password required or empty archive)`);
}

/* ── strings ─────────────────────────────────────────────────── */

function cmdStrings(state: EngineState, args: string[]): CommandResult {
  const f = args.find((a) => !a.startsWith("-"));
  if (!f) return err("strings: file required");
  if (state.challenge.id === "l2-09-stego") {
    return ok(
      `IHDR\nsRGB\nIDAT\n...binary...\nsteghide\n(strings didn't show the flag directly — try steghide extract)`,
    );
  }
  return ok("(no readable strings found)");
}

/* ── steghide ────────────────────────────────────────────────── */

function cmdSteghide(state: EngineState, args: string[]): CommandResult {
  if (args[0] !== "extract") return ok("steghide: usage: steghide extract -sf <file>");
  if (state.challenge.id === "l2-09-stego") {
    state.localFs["/root/hidden.txt"] = "CYBERAI{h1dd3n_1n_p1x3ls}";
    return ok(`Enter passphrase: \nwrote extracted data to "hidden.txt".\n\nNow: cat hidden.txt`);
  }
  return ok("steghide: no hidden data found in this file");
}

/* ── binwalk ─────────────────────────────────────────────────── */

function cmdBinwalk(state: EngineState, args: string[]): CommandResult {
  if (state.challenge.id === "l2-09-stego") {
    return ok(
      `DECIMAL    HEXADECIMAL   DESCRIPTION\n0          0x0           PNG image\n12345      0x3039        Zlib compressed data\n(extract hidden text with steghide extract)`,
    );
  }
  return ok(`DECIMAL  HEX  DESCRIPTION\n0  0x0  data\n(no hidden file found)`);
}

/* ── exiftool ────────────────────────────────────────────────── */

function cmdExiftool(state: EngineState, args: string[]): CommandResult {
  const f = args.find((a) => !a.startsWith("-"));
  if (!f) return err("exiftool: file required");
  return ok(
    `File Name      : ${f}\nFile Type      : PNG\nImage Size     : 1024x768\nComment        : (check steganography: steghide/binwalk)`,
  );
}

/* ── searchsploit ────────────────────────────────────────────── */

function cmdSearchsploit(state: EngineState, args: string[]): CommandResult {
  const q = args.join(" ").toLowerCase();
  if (q.includes("dirty") || q.includes("pipe") || state.challenge.id === "l3-08-kernel") {
    return ok(
      `---------------------------------------------------------\n Exploit Title                              |  Path\n---------------------------------------------------------\n Linux Kernel 5.8 - DirtyPipe (CVE-2022-0847) | linux/local/50808.c\n---------------------------------------------------------\n(Compile: gcc 50808.c -o exploit && ./exploit -> root)`,
    );
  }
  return ok(`No exploits found: '${q}'. Try a different keyword.`);
}

/* ── mysql ───────────────────────────────────────────────────── */

function cmdMysql(state: EngineState, args: string[]): CommandResult {
  const hostArg = grabFlag(args, "-h");
  const host = hostArg ? findHost(state, hostArg) : undefined;
  if (!host) return err("mysql: specify the DB server with -h <ip> (sandbox)");
  const sqlFile = Object.entries(host.fs ?? {}).find(([p]) => p.endsWith(".sql"));
  state.compromised.add(host.ip);
  if (sqlFile) {
    return ok(
      `Welcome to MySQL.\nmysql> SELECT * FROM vault;\n${sqlFile[1]}\n\n[+] Data retrieved.`,
    );
  }
  return ok("Welcome to MySQL.\nmysql> (show tables: SHOW DATABASES;)");
}

/* ── docker (privesc) ────────────────────────────────────────── */

function cmdDocker(state: EngineState, args: string[]): CommandResult {
  const s = currentShell(state);
  if (!s.host) return err("docker: no docker daemon on local Kali");
  const inDockerGroup = (s.host.fs?.[`/home/${s.user}/groups.txt`] ?? "").includes("docker");
  if (!inDockerGroup) return err("docker: permission denied (not in docker group)");

  if (args.includes("run") && args.some((a) => a.includes("/:/") || a.includes("chroot"))) {
    s.root = true;
    s.cwd = "/";
    return {
      kind: "system",
      promptChanged: true,
      output:
        "Unable to find image locally — pulling alpine...\n/ # chroot /mnt sh\nHost filesystem mounted — you got root!\nNow: cat /root/root.txt",
    };
  }
  return ok("docker: usage: docker run -v /:/mnt --rm -it alpine chroot /mnt sh");
}

/* ── evil-winrm (AD) ─────────────────────────────────────────── */

function cmdWinrm(state: EngineState, args: string[]): CommandResult {
  const ipArg = grabFlag(args, "-i");
  const user = grabFlag(args, "-u");
  const pass = grabFlag(args, "-p");
  if (!ipArg) return err("evil-winrm: -i <ip> -u <user> -p <pass> required");
  const host = findHost(state, ipArg);
  if (!host) return err(`evil-winrm: ${ipArg} not found (not in sandbox network)`);

  const cred = host.credentials?.find((c) => c.username === user && c.password === pass);
  if (!cred) {
    return err(`evil-winrm: authentication failed. Correct Domain Admin credential required.`);
  }

  state.compromised.add(host.ip);
  const flagFile = Object.entries(host.fs ?? {}).find(
    ([p]) => p.toLowerCase().includes("flag") || p.toLowerCase().includes("final"),
  );
  return ok(
    `Evil-WinRM shell v3.5\n*Evil-WinRM* PS C:\\Users\\${user}\\Documents> whoami\n${host.hostname?.toLowerCase()}\\${user}\n\n[+] Domain Admin shell obtained! Read the flag on the Desktop:\n${
      flagFile ? `type ${flagFile[0]}\n${flagFile[1]}` : "type Desktop\\flag.txt"
    }`,
  );
}

/* ── exit ────────────────────────────────────────────────────── */

function cmdExit(state: EngineState): CommandResult {
  if (state.shells.length <= 1) {
    return ok("(you're on the local Kali box — can't exit)");
  }
  const closed = state.shells.pop();
  return {
    kind: "system",
    promptChanged: true,
    output: `Logged out from ${closed?.user}@${closed?.host?.hostname ?? closed?.host?.ip}.`,
  };
}

/* ── flag check ──────────────────────────────────────────────── */

export function checkFlag(state: EngineState, submitted: string): boolean {
  const expected = state.challenge.flag.trim();
  const got = submitted.trim();
  const correct = got === expected;
  if (correct) {
    state.telemetry.solved = true;
    state.telemetry.submittedAt = Date.now();
  } else {
    state.telemetry.wrongAttempts += 1;
  }
  return correct;
}
