import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import {
  registerUser,
  createVerificationToken,
  sendVerificationEmail,
} from "@/lib/auth/auth-server";
import { writeAnalytics } from "@/lib/analytics";
import { jsonOk, jsonError, serverError } from "@/lib/api-response";
import { withRateLimit, isRateLimitResponse, getClientIp } from "@/lib/api-middleware";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const startTime = Date.now();
          const rl = await withRateLimit(
            request,
            "register",
            "register",
            "/api/auth/register",
            "register",
          );
          if (isRateLimitResponse(rl)) return rl;

          const body = (await request.json()) as {
            email?: string;
            password?: string;
            name?: string;
          };
          if (!body.email || !body.password) {
            return jsonError("Email and password are required.");
          }
          const email = body.email.trim().toLowerCase();
          if (!EMAIL_RE.test(email)) {
            return jsonError("Invalid email format.");
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
            return jsonError(result.error ?? "Registration failed.");
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

          return jsonOk({
            message: "Verification email sent. Please check your inbox.",
            requiresVerification: true,
          });
        } catch (err) {
          return serverError();
        }
      },
    },
  },
});
