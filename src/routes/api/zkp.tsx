import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireDb } from "@/lib/db";
import { jsonOk, jsonCreated, jsonError, catchError } from "@/lib/api-response";
import { requireAuth, isAuthResponse } from "@/lib/api-middleware";

async function generateProof(flag: string, challengeId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${flag}:${challengeId}:cyberai-zkp-v1`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/zkp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = await requireAuth(request);
          if (isAuthResponse(auth)) return auth;

          const body = (await request.json()) as {
            challenge_id: string;
            flag: string;
          };

          if (!body.challenge_id || !body.flag) {
            return jsonError("Challenge ID and flag required");
          }

          const db = requireDb();
          const challenge = await db
            .prepare("SELECT flag FROM challenges WHERE id = ?")
            .bind(body.challenge_id)
            .first<{ flag: string }>();

          if (!challenge) {
            return jsonError("Challenge not found", 404);
          }

          if (challenge.flag !== body.flag) {
            return jsonError("Invalid flag");
          }

          const proofHash = await generateProof(body.flag, body.challenge_id);

          const proofId = `zkp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          await db
            .prepare(
              `INSERT INTO console_sessions (id, user_id, challenge_id, command_history)
               VALUES (?, ?, ?, ?)`,
            )
            .bind(
              proofId,
              auth.user.id,
              body.challenge_id,
              JSON.stringify({
                type: "zkp_proof",
                proof_hash: proofHash,
                public_input: body.challenge_id,
                created_at: Date.now(),
              }),
            )
            .run();

          return jsonCreated({
            data: {
              id: proofId,
              proof_hash: proofHash,
              public_input: body.challenge_id,
              created_at: Date.now(),
              verified: true,
            },
          });
        } catch (err) {
          return catchError(err, "Failed to generate proof");
        }
      },

      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const proofId = url.searchParams.get("id");
          const challengeId = url.searchParams.get("challenge_id");

          if (!proofId && !challengeId) {
            return jsonError("Proof ID or Challenge ID required");
          }

          const db = requireDb();
          let proof;

          if (proofId) {
            const session = await db
              .prepare("SELECT command_history FROM console_sessions WHERE id = ?")
              .bind(proofId)
              .first<{ command_history: string }>();

            if (session) {
              const data = JSON.parse(session.command_history);
              if (data.type === "zkp_proof") {
                proof = { id: proofId, ...data };
              }
            }
          }

          if (!proof && challengeId) {
            const sessions = await db
              .prepare(
                "SELECT id, command_history FROM console_sessions WHERE challenge_id = ? AND command_history LIKE '%zkp_proof%'",
              )
              .bind(challengeId)
              .all<{ id: string; command_history: string }>();

            if (sessions.results && sessions.results.length > 0) {
              const latest = sessions.results[sessions.results.length - 1];
              const data = JSON.parse(latest.command_history);
              proof = { id: latest.id, ...data };
            }
          }

          if (!proof) {
            return jsonError("Proof not found", 404);
          }

          return jsonOk({ data: proof });
        } catch (err) {
          return catchError(err, "Failed to verify proof");
        }
      },
    },
  },
});
