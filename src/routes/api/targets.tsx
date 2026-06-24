import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireDb, getEnv } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";

interface TargetTemplate {
  id: string;
  name: string;
  description: string;
  os: string;
  services: string[];
  difficulty: number;
  category: string;
  docker_image: string;
}

const TARGET_TEMPLATES: TargetTemplate[] = [
  {
    id: "ubuntu-web",
    name: "Ubuntu Web Server",
    description: "Standard Ubuntu server with Apache, MySQL, and SSH.",
    os: "Ubuntu 22.04 LTS",
    services: ["http", "ssh", "mysql"],
    difficulty: 1,
    category: "web",
    docker_image: "ubuntu:22.04",
  },
  {
    id: "centos-mail",
    name: "CentOS Mail Server",
    description: "CentOS server with Postfix, Dovecot, and webmail.",
    os: "CentOS Stream 9",
    services: ["smtp", "imap", "ssh"],
    difficulty: 2,
    category: "network",
    docker_image: "centos:stream9",
  },
  {
    id: "debian-db",
    name: "Debian Database Server",
    description: "Debian server with PostgreSQL and Redis.",
    os: "Debian 12",
    services: ["postgresql", "redis", "ssh"],
    difficulty: 2,
    category: "network",
    docker_image: "debian:12",
  },
  {
    id: "alpine-container",
    name: "Alpine Container Host",
    description: "Alpine Linux with Docker and containerized services.",
    os: "Alpine 3.18",
    services: ["docker", "ssh"],
    difficulty: 3,
    category: "privesc",
    docker_image: "alpine:3.18",
  },
  {
    id: "kali-pentest",
    name: "Kali Pentest Box",
    description: "Kali Linux with common pentesting tools.",
    os: "Kali Linux Rolling",
    services: ["ssh", "metasploit"],
    difficulty: 2,
    category: "recon",
    docker_image: "kalilinux/kali-rolling",
  },
];

const DOCKER_PROXY_URL_DEFAULT = "https://docker.cyberaiuz.workers.dev";

export const Route = createFileRoute("/api/targets")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const category = url.searchParams.get("category");
          const difficulty = url.searchParams.get("difficulty");

          let templates = TARGET_TEMPLATES;

          if (category) {
            templates = templates.filter((t) => t.category === category);
          }
          if (difficulty) {
            templates = templates.filter((t) => t.difficulty === parseInt(difficulty));
          }

          return new Response(
            JSON.stringify({
              ok: true,
              data: templates,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: err instanceof Error ? err.message : "Failed to load targets",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },

      POST: async ({ request }) => {
        try {
          const env = getEnv();
          const dockerApiKey = (env as Record<string, unknown>).DOCKER_API_KEY as string;
          const dockerProxyUrl =
            ((env as Record<string, unknown>).DOCKER_PROXY_URL as string) ||
            DOCKER_PROXY_URL_DEFAULT;

          const token = getSessionToken(request);
          const session = token ? await verifySession(token) : null;

          if (!session?.ok || !session.user?.id) {
            return new Response(JSON.stringify({ ok: false, error: "Authentication required" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = (await request.json()) as { template_id: string };

          if (!body.template_id) {
            return new Response(JSON.stringify({ ok: false, error: "Template ID required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const template = TARGET_TEMPLATES.find((t) => t.id === body.template_id);
          if (!template) {
            return new Response(JSON.stringify({ ok: false, error: "Template not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          // If Docker API key is configured, use real Docker proxy
          if (dockerApiKey) {
            try {
              const dockerResponse = await fetch(`${dockerProxyUrl}/api/containers`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${dockerApiKey}`,
                },
                body: JSON.stringify({
                  template_id: body.template_id,
                  user_id: session.user.id,
                }),
              });

              const dockerData = await dockerResponse.json();

              if (dockerData.ok) {
                // Store in database
                const db = requireDb();
                await db
                  .prepare(
                    `INSERT INTO console_sessions (id, user_id, challenge_id, command_history)
                     VALUES (?, ?, ?, ?)`,
                  )
                  .bind(
                    dockerData.data.id,
                    session.user.id,
                    template.id,
                    JSON.stringify({ ...dockerData.data, template, created_at: Date.now() }),
                  )
                  .run();

                return new Response(JSON.stringify({ ok: true, data: dockerData.data }), {
                  status: 201,
                  headers: { "Content-Type": "application/json" },
                });
              }
            } catch (dockerErr) {
              console.error("Docker proxy error:", dockerErr);
              // Fall through to simulated mode
            }
          }

          // Fallback: simulated mode (no Docker available)
          const targetId = `target_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const ip = `10.10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

          const db = requireDb();
          await db
            .prepare(
              `INSERT INTO console_sessions (id, user_id, challenge_id, command_history)
               VALUES (?, ?, ?, ?)`,
            )
            .bind(
              targetId,
              session.user.id,
              template.id,
              JSON.stringify({ ip, template, created_at: Date.now(), simulated: true }),
            )
            .run();

          return new Response(
            JSON.stringify({
              ok: true,
              data: {
                id: targetId,
                ip,
                template,
                status: "running",
                simulated: true,
                created_at: Date.now(),
              },
            }),
            {
              status: 201,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: err instanceof Error ? err.message : "Failed to create target",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
