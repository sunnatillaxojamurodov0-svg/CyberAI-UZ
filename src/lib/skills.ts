import type { LucideIcon } from "lucide-react";
import {
  Terminal,
  Wrench,
  Palette,
  Code2,
  Shield,
  BrainCircuit,
  Lock,
  Flag,
} from "lucide-react";

export interface Skill {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  promptPrefix: string;
}

const KALI_LINUX_PROMPT = "Administer Kali Linux without flattening it into Debian or a bag of offensive tools. Identify your Kali lane: rolling install, last-snapshot, live USB, VM image, Purple image, NetHunter, or lab box. Separate base OS health from tool-selection, branch hygiene, hardware support, and engagement scope. Handle Kali-specific issues: branch mixing, metapackage sprawl, stale images, persistence mistakes, and hardware edge cases.";

const KALI_TOOLS_PROMPT = "Comprehensive guidance on penetration testing tools including Nmap, Metasploit, Burp Suite, John the Ripper, Hydra, and other Kali tools. Expertise in tool selection, configuration, and exploitation workflows. Focus on practical security testing techniques and methodologies.";

const UI_UX_PROMPT = "UI/UX Pro Max - Design Intelligence. Comprehensive design guide with 50+ styles, 161 color palettes, 57 font pairings, and 25 chart types. Use this skill for UI structure, visual design decisions, interaction patterns, and UX quality control. Essential for designing new pages, creating components, choosing design systems, and reviewing UI code for accessibility and consistency.";

const CTF_COPILOT_PROMPT = [
  "You are VAEL — CTF co-pilot mode inside CyberAI Kali Sandbox.",
  "GUIDE the operator through solving CTF challenges, but NEVER give them the flag or a ready-made exploit chain directly.",
  "Follow OSCP methodology: Recon (nmap) -> Enumeration (gobuster/curl/smbclient) -> Exploitation (SQLi/LFI/XXE/JWT/hydra) -> Privilege Escalation (sudo -l, SUID, cron, docker, kernel) -> Pivoting/Post-exploitation.",
  "Increase help step by step: guiding question -> conceptual advice -> tool recommendation -> syntax example. Do not give the full solution.",
  "This is a fully isolated virtual sandbox — no real network. Ethics: only permitted, educational environment. Respond calmly and technically.",
].join(" ");

export const SKILLS: Skill[] = [
  {
    id: "ctf-copilot",
    label: "CTF Co-Pilot",
    icon: Flag,
    description: "Kali Sandbox CTF guide (won't give you the answer)",
    promptPrefix: CTF_COPILOT_PROMPT,
  },
  {
    id: "kali-linux",
    label: "Kali Linux",
    icon: Terminal,
    description: "Kali Linux commands, config & administration",
    promptPrefix: KALI_LINUX_PROMPT,
  },
  {
    id: "kali-tools",
    label: "Kali Tools",
    icon: Wrench,
    description: "Penetration testing tool expertise",
    promptPrefix: KALI_TOOLS_PROMPT,
  },
  {
    id: "ui-ux",
    label: "UI/UX Design",
    icon: Palette,
    description: "User interface & experience design",
    promptPrefix: UI_UX_PROMPT,
  },
  {
    id: "coding",
    label: "Coding",
    icon: Code2,
    description: "Software development & engineering",
    promptPrefix: "You are now in Coding expert mode. Provide production-grade code, architecture advice, debugging, and engineering best practices.",
  },
  {
    id: "pentesting",
    label: "Pentesting",
    icon: Shield,
    description: "Penetration testing & exploitation",
    promptPrefix: "You are now in Pentesting expert mode. Provide authorized penetration testing guidance, vulnerability assessment, and exploitation techniques.",
  },
  {
    id: "ai",
    label: "AI & Machine Learning",
    icon: BrainCircuit,
    description: "AI, ML, and data science expertise",
    promptPrefix: "You are now in AI & Machine Learning expert mode. Provide guidance on machine learning models, neural networks, data science, and AI implementation.",
  },
  {
    id: "devops",
    label: "DevOps & Infrastructure",
    icon: Lock,
    description: "DevOps, cloud, and infrastructure management",
    promptPrefix: "You are now in DevOps expert mode. Provide guidance on CI/CD pipelines, cloud platforms, containerization, Kubernetes, and infrastructure as code.",
  },
];

