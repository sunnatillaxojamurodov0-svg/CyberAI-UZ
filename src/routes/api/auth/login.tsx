import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { loginUser, setSessionCookie } from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const ip = request.headers.get("cf-connecting-ip") || "unknown";
          const rl = await checkRateLimit(rateLimitKey(ip, "login"), "auth");
          if (!rl.allowed) {
            return new Response(
              JSON.stringify({ ok: false, error: `Too many attempts. Try again in ${Math.ceil((rl.resetAt - Date.now() / 1000) / 60)} minutes.` }),
              { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil(rl.resetAt - Date.now() / 1000)) } },
            );
          }

          const body = await request.json() as { email?: string; password?: string };
          if (!body.email || !body.password) {
            return new Response(JSON.stringify({ ok: false, error: "Email and password are required." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const result = await loginUser(body.email, body.password);
          if (!result.ok || !result.token) {
            return new Response(JSON.stringify({ ok: false, error: result.error ?? "Login failed." }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
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
