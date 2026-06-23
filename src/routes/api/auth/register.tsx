import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { registerUser, setSessionCookie } from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { writeAnalytics } from "@/lib/analytics";
import { getEnv } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const ip = request.headers.get("cf-connecting-ip") || "unknown";
          const startTime = Date.now();
          const rl = await checkRateLimit(rateLimitKey(ip, "register"), "register");
          if (!rl.allowed) {
            writeAnalytics("register", "denied", null, "/api/auth/register", Date.now() - startTime);
            return new Response(
              JSON.stringify({
                ok: false,
                error: "Too many registration attempts. Try again later.",
              }),
              { status: 429, headers: { "Content-Type": "application/json" } },
            );
          }

          const body = (await request.json()) as {
            email?: string;
            password?: string;
            name?: string;
          };
          if (!body.email || !body.password) {
            return new Response(
              JSON.stringify({ ok: false, error: "Email and password are required." }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
          const email = body.email.trim().toLowerCase();
          if (!EMAIL_RE.test(email)) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid email format." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const name = body.name?.trim().slice(0, 100) || undefined;
          const result = await registerUser(email, body.password, name);
          if (!result.ok || !result.token) {
            writeAnalytics("register", "denied", null, "/api/auth/register", Date.now() - startTime);
            return new Response(
              JSON.stringify({ ok: false, error: result.error ?? "Registration failed." }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
          writeAnalytics("register", "success", result.user?.id ?? null, "/api/auth/register", Date.now() - startTime);

          const env = getEnv();
          const onboarding = env.USER_ONBOARDING as { create: (opts: { id: string; params: Record<string, unknown> }) => Promise<unknown> } | undefined;
          if (onboarding && result.user?.id) {
            onboarding.create({
              id: `onboard-${result.user.id}`,
              params: {
                userId: result.user.id,
                email: email,
                name: name ?? "User",
              },
            }).catch(() => {});
          }

          return new Response(JSON.stringify({ ok: true, user: result.user }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": setSessionCookie(result.token),
            },
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: "Internal server error." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
