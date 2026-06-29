import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { StatusPill } from "@/components/shared/StatusPill";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { AnimatedGrid } from "@/components/shared/AnimatedGrid";
import { useAuth } from "@/lib/auth-context";
import { AboutMe } from "./AboutMe";
import BlurText from "@/components/ui/BlurText";
import Silk from "@/components/ui/Silk";
import DotField from "@/components/ui/DotField";

export function Hero() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const launchCtfLab = () => {
    if (user) {
      navigate({ to: "/console" });
    } else {
      openAuthModal();
    }
  };

  return (
    <section className="relative min-h-[921px] flex items-center justify-center px-6 pt-20 overflow-hidden">
      {/* AnimatedGrid - asosiy fon */}
      <AnimatedGrid />

      {/* Silk - binafsharang ipak fon */}
      <div className="absolute inset-0 z-0 opacity-25">
        <Silk speed={5} scale={1} color="#7B2FBE" noiseIntensity={1.5} rotation={0} />
      </div>

      {/* DotField - nuqtalar tarmog'i */}
      <div className="absolute inset-0 z-0">
        <DotField dotColor="rgba(123, 47, 190, 0.2)" dotSize={1.5} gridGap={40} />
      </div>

      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start gap-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                v2.0 Beta Live
              </span>
            </div>

            <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[1.1] tracking-[-0.04em] text-balance">
              <BlurText
                text="Secure the Synthetic Era"
                animateBy="words"
                direction="top"
                delay={200}
                stepDuration={0.35}
                className="gradient-text"
              />
            </h1>

            <p className="text-base md:text-xl text-muted-foreground max-w-xl">
              Elite cybersecurity training powered by advanced AI. Experience real-world threats in
              our secure cloud environments, guided by your personal AI mentor.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <MagneticButton onClick={launchCtfLab}>
                Start for Free
                <ArrowUpRight size={16} className="opacity-80" />
              </MagneticButton>
              <AboutMe />
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex -space-x-3">
                {["P1", "P2", "P3"].map((p, i) => (
                  <div
                    key={p}
                    className="size-10 rounded-full border-2 border-background bg-surface-2 flex items-center justify-center text-[10px] font-mono text-muted-foreground"
                  >
                    {p}
                  </div>
                ))}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                Join 50,000+ elite researchers
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <TerminalVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TerminalVisual() {
  const [lines, setLines] = useState<{ text: string; color?: string; prompt?: string }[]>([]);
  const [showAi, setShowAi] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  const fullLines: { text: string; color?: string; prompt?: string; delay?: number }[] = [
    { text: "sudo su", prompt: "┌──(kali㉿cyberai)-[~]", delay: 1200 },
    { text: "[sudo] password for operator: ••••••••", color: "text-white/50", delay: 800 },
    { text: "", delay: 400 },
    { text: "root@cyberai:~# nmap -sV -sC 192.168.1.0/24", prompt: "root@cyberai:~#", color: "text-white", delay: 1500 },
    { text: "Starting Nmap 7.94 ( https://nmap.org )", color: "text-white/60", delay: 600 },
    { text: "Nmap scan report for 192.168.1.1", color: "text-white/80", delay: 400 },
    { text: "PORT     STATE SERVICE  VERSION", color: "text-white/60", delay: 300 },
    { text: "22/tcp   open  ssh      OpenSSH 9.2", color: "text-primary", delay: 300 },
    { text: "80/tcp   open  http     nginx 1.24", color: "text-primary", delay: 300 },
    { text: "443/tcp  open  https    nginx 1.24", color: "text-primary", delay: 300 },
    { text: "3306/tcp open  mysql    MySQL 8.0.35", color: "text-destructive", delay: 400 },
    { text: "", delay: 300 },
    { text: "root@cyberai:~# whoami && id", prompt: "root@cyberai:~#", color: "text-white", delay: 1200 },
    { text: "root", color: "text-primary", delay: 200 },
    { text: "uid=0(root) gid=0(root) groups=0(root)", color: "text-white/80", delay: 300 },
    { text: "", delay: 200 },
    { text: "root@cyberai:~# msfconsole -q", prompt: "root@cyberai:~#", color: "text-white", delay: 1800 },
    { text: "=[ metasploit v6.4.19-dev ]", color: "text-destructive", delay: 500 },
    { text: "+ -- --=[ 2414 exploits - 1242 auxiliary ]", color: "text-white/60", delay: 300 },
    { text: "+ -- --=[ 429 payloads - 47 encoders ]", color: "text-white/60", delay: 300 },
    { text: "", delay: 400 },
    { text: "msf6 > sessions -l", color: "text-white", delay: 1000 },
    { text: "Active sessions", color: "text-primary", delay: 300 },
    { text: "  Id  Name  Type  Information", color: "text-white/60", delay: 200 },
    { text: "  --  ----  ----  -----------", color: "text-white/30", delay: 200 },
    { text: "  1   shell  x64  Linux victim 5.15.0", color: "text-primary", delay: 300 },
    { text: "", delay: 400 },
    { text: "msf6 > exploit -j", color: "text-white", delay: 1200 },
    { text: "[*] Exploit running as background job 1.", color: "text-destructive", delay: 400 },
    { text: "[*] Started reverse TCP handler on 0.0.0.0:4444", color: "text-white/60", delay: 300 },
    { text: "[*] Sending stage (3045380 bytes) to 192.168.1.50", color: "text-white/60", delay: 400 },
    { text: "[+] Meterpreter session 2 opened", color: "text-primary", delay: 500 },
  ];

  useEffect(() => {
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const blink = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);

    const addLine = () => {
      if (cancelled) return;
      if (i < fullLines.length) {
        const line = fullLines[i];
        setLines((prev) => [...prev, { text: line.text, color: line.color, prompt: line.prompt }]);
        i++;
        t = setTimeout(addLine, line.delay || 500);
      } else {
        t = setTimeout(() => setShowAi(true), 600);
      }
    };
    t = setTimeout(addLine, 800);
    return () => {
      cancelled = true;
      clearTimeout(t);
      clearInterval(blink);
    };
  }, []);

  return (
    <div className="relative h-[600px] rounded-2xl bg-[#0a0f0d] border border-[#1a2e24]/50 overflow-hidden shadow-2xl transition-all duration-500 hover:border-primary/20 hover:shadow-[0_0_40px_-10px] shadow-primary/10">
      {/* Kali Linux title bar */}
      <div className="flex items-center justify-between bg-[#0a0f0d] border-b border-[#1a2e24] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#FF5F56]" />
            <span className="size-2.5 rounded-full bg-[#FFBD2E]" />
            <span className="size-2.5 rounded-full bg-[#27C93F]" />
          </div>
          <div className="flex items-center gap-2 ml-2">
            <svg viewBox="0 0 24 24" className="size-4 text-primary" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span className="font-mono text-xs text-primary font-bold tracking-wider">kali㉿cyberai</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">root@cyberai</span>
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
        </div>
      </div>

      {/* Terminal content */}
      <div className="absolute inset-4 top-12 rounded-xl bg-[#0a0f0d] backdrop-blur-sm p-4 flex flex-col font-mono text-[11px] md:text-xs overflow-hidden">
        <div className="flex-grow space-y-1 overflow-y-auto scrollbar-thin">
          <div className="text-white/50 text-[10px] mb-3">── Kali Linux Terminal ──</div>

          {lines.map((line, i) => (
            <div key={i} className="leading-relaxed">
              {line.prompt && (
                <span className="text-primary font-bold">{line.prompt} </span>
              )}
              <span className={line.color || "text-slate-300"}>
                {line.text || "\u00A0"}
              </span>
            </div>
          ))}
          {lines.length > 0 && lines.length <= fullLines.length && (
            <span className={`text-primary ${cursorVisible ? "opacity-100" : "opacity-0"}`}>█</span>
          )}

          {showAi && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-3 p-3 bg-surface rounded-lg border border-primary/30 flex items-start gap-3"
            >
              <span className="text-primary mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </span>
              <div>
                <p className="text-primary font-bold tracking-wide text-[10px] uppercase">
                  VAEL AI · Root Access Confirmed
                </p>
                <p className="text-[10px] mt-1 text-white/60">
                  Meterpreter session established. Target: 192.168.1.50. Ready for post-exploitation.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
