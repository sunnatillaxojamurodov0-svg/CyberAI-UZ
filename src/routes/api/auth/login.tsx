import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  loginUser,
  isEmailVerified,
  createVerificationToken,
  sendVerificationEmail,
  setSessionCookie,
  recordLoginAttempt,
  isAccountLocked,
} from "@/lib/auth/auth-server";
import { is2FAEnabled, verify2FA } from "@/lib/auth/totp";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { writeAnalytics } from "@/lib/analytics";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const ip = request.headers.get("cf-connecting-ip") || "unknown";
          const startTime = Date.now();
          const rl = await checkRateLimit(rateLimitKey(ip, "login"), "auth");
          if (!rl.allowed) {
            writeAnalytics("login", "denied", null, "/api/auth/login", Date.now() - startTime);
            return new Response(
              JSON.stringify({
                ok: false,
                error: `Too many attempts. Try again in ${Math.ceil((rl.resetAt - Date.now() / 1000) / 60)} minutes.`,
              }),
              {
                status: 429,
                headers: {
                  "Content-Type": "application/json",
                  "Retry-After": String(Math.ceil(rl.resetAt - Date.now() / 1000)),
                },
              },
            );
          }

          const body = (await request.json()) as {
            email?: string;
            password?: string;
            totpToken?: string;
            rememberMe?: boolean;
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
          const locked = await isAccountLocked(email);
          if (locked.locked) {
            const minutesLeft = Math.ceil(((locked.lockoutExpires ?? 0) - Date.now() / 1000) / 60);
            writeAnalytics("login", "locked", null, "/api/auth/login", Date.now() - startTime);
            return new Response(
              JSON.stringify({
                ok: false,
                error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
                locked: true,
                lockoutExpires: locked.lockoutExpires,
              }),
              {
                status: 423,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const result = await loginUser(email, body.password, body.rememberMe ?? false);
          if (!result.ok || !result.token || !result.user) {
            const attempt = await recordLoginAttempt(email, ip, false);
            writeAnalytics("login", "denied", null, "/api/auth/login", Date.now() - startTime);
            return new Response(
              JSON.stringify({
                ok: false,
                error: result.error ?? "Login failed.",
                attemptsRemaining: attempt.attemptsRemaining,
                locked: attempt.locked,
              }),
              {
                status: 401,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const verified = await isEmailVerified(result.user.id);
          if (!verified) {
            const verificationToken = await createVerificationToken(result.user.id);
            sendVerificationEmail(result.user.email, verificationToken).catch(() => {});
            return new Response(
              JSON.stringify({
                ok: false,
                error: "Please verify your email first. A new verification link has been sent.",
                requiresVerification: true,
              }),
              {
                status: 403,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const twoFAEnabled = await is2FAEnabled(result.user.id);
          if (twoFAEnabled) {
            if (!body.totpToken) {
              return new Response(
                JSON.stringify({
                  ok: false,
                  error: "Two-factor authentication required.",
                  requires2FA: true,
                }),
                {
                  status: 403,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }

            const totpValid = await verify2FA(result.user.id, body.totpToken);
            if (!totpValid) {
              const attempt = await recordLoginAttempt(email, ip, false);
              writeAnalytics("login", "denied", null, "/api/auth/login", Date.now() - startTime);
              return new Response(
                JSON.stringify({
                  ok: false,
                  error: "Invalid two-factor code.",
                  attemptsRemaining: attempt.attemptsRemaining,
                  locked: attempt.locked,
                }),
                {
                  status: 401,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }
          }

          await recordLoginAttempt(email, ip, true);
          writeAnalytics(
            "login",
            "success",
            result.user.id,
            "/api/auth/login",
            Date.now() - startTime,
          );
          const ttl = result.expiresAt
            ? result.expiresAt - Math.floor(Date.now() / 1000)
            : 7 * 24 * 60 * 60;
          return new Response(JSON.stringify({ ok: true, user: result.user }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": setSessionCookie(result.token, ttl),
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
