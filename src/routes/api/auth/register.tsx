import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  registerUser,
  createVerificationToken,
  sendVerificationEmail,
} from "@/lib/auth/auth-server";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { writeAnalytics } from "@/lib/analytics";

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
            writeAnalytics(
              "register",
              "denied",
              null,
              "/api/auth/register",
              Date.now() - startTime,
            );
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
          if (!result.ok || !result.user) {
            writeAnalytics(
              "register",
              "denied",
              null,
              "/api/auth/register",
              Date.now() - startTime,
            );
            return new Response(
              JSON.stringify({ ok: false, error: result.error ?? "Registration failed." }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const verificationToken = await createVerificationToken(result.user.id);
          sendVerificationEmail(email, verificationToken).catch(() => {});

          writeAnalytics(
            "register",
            "success",
            result.user.id,
            "/api/auth/register",
            Date.now() - startTime,
          );

          return new Response(
            JSON.stringify({
              ok: true,
              message: "Verification email sent. Please check your inbox.",
              requiresVerification: true,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
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
