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
import { jsonOk, jsonError, jsonResponse, serverError } from "@/lib/api-response";
import { getClientIp } from "@/lib/api-middleware";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const ip = getClientIp(request);
          const startTime = Date.now();
          const rl = await checkRateLimit(rateLimitKey(ip, "login"), "auth");
          if (!rl.allowed) {
            writeAnalytics("login", "denied", null, "/api/auth/login", Date.now() - startTime);
            return jsonResponse(
              {
                ok: false,
                error: `Too many attempts. Try again in ${Math.ceil((rl.resetAt - Date.now() / 1000) / 60)} minutes.`,
              },
              429,
              { "Retry-After": String(Math.ceil(rl.resetAt - Date.now() / 1000)) },
            );
          }

          const body = (await request.json()) as {
            email?: string;
            password?: string;
            totpToken?: string;
          };
          if (!body.email || !body.password) {
            return jsonError("Email and password are required.");
          }

          const email = body.email.trim().toLowerCase();
          const locked = await isAccountLocked(email);
          if (locked.locked) {
            const minutesLeft = Math.ceil(((locked.lockoutExpires ?? 0) - Date.now() / 1000) / 60);
            writeAnalytics("login", "locked", null, "/api/auth/login", Date.now() - startTime);
            return jsonError(
              `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
              423,
              { locked: true, lockoutExpires: locked.lockoutExpires },
            );
          }

          const result = await loginUser(email, body.password);
          if (!result.ok || !result.token || !result.user) {
            const attempt = await recordLoginAttempt(email, ip, false);
            writeAnalytics("login", "denied", null, "/api/auth/login", Date.now() - startTime);
            return jsonError(result.error ?? "Login failed.", 401, {
              attemptsRemaining: attempt.attemptsRemaining,
              locked: attempt.locked,
            });
          }

          const verified = await isEmailVerified(result.user.id);
          if (!verified) {
            const verificationToken = await createVerificationToken(result.user.id);
            sendVerificationEmail(result.user.email, verificationToken).catch(() => {});
            return jsonError(
              "Please verify your email first. A new verification link has been sent.",
              403,
              { requiresVerification: true },
            );
          }

          const twoFAEnabled = await is2FAEnabled(result.user.id);
          if (twoFAEnabled) {
            if (!body.totpToken) {
              return jsonError("Two-factor authentication required.", 403, {
                requires2FA: true,
              });
            }

            const totpValid = await verify2FA(result.user.id, body.totpToken);
            if (!totpValid) {
              const attempt = await recordLoginAttempt(email, ip, false);
              writeAnalytics("login", "denied", null, "/api/auth/login", Date.now() - startTime);
              return jsonError("Invalid two-factor code.", 401, {
                attemptsRemaining: attempt.attemptsRemaining,
                locked: attempt.locked,
              });
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
          return jsonOk(
            { user: result.user },
            {
              "Set-Cookie": setSessionCookie(result.token),
            },
          );
        } catch (err) {
          return serverError();
        }
      },
    },
  },
});
