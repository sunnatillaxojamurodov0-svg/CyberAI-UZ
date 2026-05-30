import { useState } from "react";
import MeImage from "@/assets/Me.jpg";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MapPin,
  Calendar,
  Globe,
  Video,
  MessageCircle,
  Target,
  Eye,
  Code2,
  Shield,
  Bot,
  Quote,
  ChevronRight,
  ExternalLink,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SKILLS = {
  languages: ["HTML", "CSS", "JavaScript", "TypeScript", "TSX", "Python", "C++", "Java", "SQL", "JSON"],
  interests: [
    { icon: Shield, label: "Cyber Security" },
    { icon: Bot, label: "Artificial Intelligence" },
    { icon: Globe, label: "Web Development" },
    { icon: Code2, label: "Automation Systems" },
    { icon: Bot, label: "AI Assistants" },
    { icon: User, label: "Digital Literacy" },
    { icon: Code2, label: "Software Engineering" },
  ],
};

export function AboutMe() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-medium text-foreground/80 transition-all duration-300 hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
      >
        <span className="relative z-10">About Me</span>
        <ChevronRight size={14} className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5" />
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-accent/5 to-transparent transition-transform duration-500 group-hover:translate-x-0" />
      </button>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent
          className="max-h-[90vh] max-w-3xl overflow-y-auto border-border bg-background p-0 sm:rounded-2xl select-none"
          onContextMenu={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onSelect={(e) => e.preventDefault()}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          {/* ── Header ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-accent/10 via-background to-primary/5 px-8 pt-10 pb-8">
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-accent/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 size-48 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="group/avatar relative shrink-0">
                <div
                  className="relative size-28 overflow-hidden border-2 border-accent/20 shadow-[0_0_30px_-8px] shadow-accent/20 select-none"
                  style={{ borderRadius: 0 }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <img
                    src={MeImage}
                    alt=""
                    draggable={false}
                    className="size-full object-cover pointer-events-none"
                    style={{ userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
                    onDragStart={(e) => e.preventDefault()}
                    onCopy={(e) => e.preventDefault()}
                    onSelect={(e) => e.preventDefault()}
                    onMouseDown={(e) => {
                      if (e.button === 2) e.preventDefault();
                    }}
                  />
                  <div className="absolute inset-0 bg-transparent pointer-events-none" />
                </div>
              </div>

              <div className="flex-1">
                <DialogTitle className="font-display text-3xl font-bold tracking-tight text-foreground">
                  Sunnatilla Xo'jamurodov
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground/80">
                  Founder & Creator of CyberAI
                </DialogDescription>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} /> Born 2009
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} /> Ohangaron, Uzbekistan
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User size={12} /> He/Him
                  </span>
                </div>
              </div>
            </div>

            {/* Social links */}
            <div className="relative mt-6 flex flex-wrap items-center gap-3">
              <a
                href="https://youtube.com/@CyberAI_UZ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
              >
                <Video size={13} /> YouTube
                <ExternalLink size={10} className="opacity-50" />
              </a>
              <a
                href="https://t.me/Cyber_AI_UZ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-400"
              >
                <MessageCircle size={13} /> Telegram Community
                <ExternalLink size={10} className="opacity-50" />
              </a>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="space-y-8 px-8 py-6">
            {/* Bio */}
            <div>
              <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">About</h4>
              <p className="text-sm leading-relaxed text-foreground/85">
                Sunnatilla is a self-taught technologist, cybersecurity researcher, and AI architect from
                Ohangaron, Uzbekistan. His passion for technology, artificial intelligence, and
                cybersecurity led him to found CyberAI — a sovereign platform designed to make
                advanced technical knowledge accessible to everyone.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                His work focuses on building practical, real-world systems that bridge the gap between
                complex AI research and everyday usability. CyberAI and its intelligent assistant VAEL
                are the culmination of years of self-directed study in programming, security, and
                machine learning systems.
              </p>
            </div>

            {/* Mission */}
            <div className="rounded-xl border border-accent/15 bg-accent/[0.02] p-5">
              <div className="flex items-start gap-3">
                <Target size={16} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <h4 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Mission</h4>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    To equip people with practical AI, cybersecurity, and programming knowledge —
                    breaking down complex technology into accessible, actionable skills for the
                    digital age.
                  </p>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Technical Skills</h4>
              <div className="mb-4">
                <span className="text-[11px] font-medium text-muted-foreground/70">Languages</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SKILLS.languages.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 font-mono text-[10px] font-medium text-foreground/70"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-medium text-muted-foreground/70">Areas of Interest</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SKILLS.interests.map((item) => {
                    const Icon = item.icon;
                    return (
                      <span
                        key={item.label}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-accent/10 bg-accent/5 px-2.5 py-1 font-mono text-[10px] font-medium text-accent/80"
                      >
                        <Icon size={11} /> {item.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CyberAI */}
            <div className="rounded-xl border border-border bg-surface/20 p-5">
              <div className="flex items-start gap-3">
                <Shield size={16} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <h4 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">About CyberAI</h4>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    CyberAI is a modern educational platform designed for learning AI, cybersecurity,
                    and programming. It provides tools, courses, and hands-on projects to help users
                    understand technology, build practical skills, and stay informed about the latest
                    developments in the field. At its core is VAEL — an intelligent assistant that
                    answers questions, explains concepts, and supports the learning journey.
                  </p>
                </div>
              </div>
            </div>

            {/* Vision */}
            <div>
              <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Vision</h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  "Advanced AI services",
                  "Interactive learning systems",
                  "Cybersecurity laboratories",
                  "Programming courses",
                  "Technology community building",
                  "Digital literacy initiatives",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 rounded-lg border border-border bg-surface/30 px-3.5 py-2.5">
                    <Eye size={13} className="shrink-0 text-accent/70" />
                    <span className="text-xs text-foreground/75">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* VAEL */}
            <div className="rounded-xl border border-accent/10 bg-accent/[0.02] p-5">
              <div className="flex items-start gap-3">
                <Bot size={16} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <h4 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Current Project — VAEL</h4>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    VAEL is the AI assistant being developed for the CyberAI ecosystem. It is
                    designed for rapid response to queries, educational support, clear
                    explanation of technical concepts, natural conversation, and serves as the
                    foundation for a future expanded AI platform. VAEL is currently in active
                    development.
                  </p>
                </div>
              </div>
            </div>

            {/* Quote */}
            <div className="relative border-l-2 border-accent/40 pl-5 py-3">
              <Quote size={14} className="absolute -left-2 -top-1 text-accent/30" />
              <p className="text-sm leading-relaxed italic text-foreground/70">
                Technology is not just a tool. When used correctly, it becomes a force that
                expands human potential.
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground/50">
                — Sunnatilla Xo'jamurodov, Founder of CyberAI
              </p>
            </div>

            {/* Watermark footer */}
            <div className="select-none text-center text-[10px] font-mono text-muted-foreground/20 tracking-[0.15em] uppercase">
              CyberAI · Sovereign Intelligence
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
