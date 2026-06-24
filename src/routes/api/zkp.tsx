import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { requireDb } from "@/lib/db";
import { getSessionToken, verifySession } from "@/lib/auth/auth-server";

interface ZKPProof {
  id: string;
  challenge_id: string;
  user_id: string;
  proof_hash: string;
  public_input: string;
  created_at: number;
  verified: boolean;
}

// Simple hash-based proof of knowledge
// In production, this would use proper ZKP libraries like snarkjs or circom
async function generateProof(flag: string, challengeId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${flag}:${challengeId}:cyberai-zkp-v1`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyProof(proofHash: string, flag: string, challengeId: string): Promise<boolean> {
  const expectedHash = await generateProof(flag, challengeId);
  return proofHash === expectedHash;
}

export const Route = createFileRoute("/api/zkp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = getSessionToken(request);
          const session = token ? await verifySession(token) : null;

          if (!session?.ok || !session.user?.id) {
            return new Response(JSON.stringify({ ok: false, error: "Authentication required" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = (await request.json()) as {
            challenge_id: string;
            flag: string;
          };

          if (!body.challenge_id || !body.flag) {
            return new Response(
              JSON.stringify({ ok: false, error: "Challenge ID and flag required" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          // Get the actual flag from the database
          const db = requireDb();
          const challenge = await db
            .prepare("SELECT flag FROM challenges WHERE id = ?")
            .bind(body.challenge_id)
            .first<{ flag: string }>();

          if (!challenge) {
            return new Response(JSON.stringify({ ok: false, error: "Challenge not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Verify the flag is correct
          if (challenge.flag !== body.flag) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid flag" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Generate ZKP proof
          const proofHash = await generateProof(body.flag, body.challenge_id);

          // Store the proof
          const proofId = `zkp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          await db
            .prepare(
              `INSERT INTO console_sessions (id, user_id, challenge_id, command_history)
               VALUES (?, ?, ?, ?)`,
            )
            .bind(
              proofId,
              session.user.id,
              body.challenge_id,
              JSON.stringify({
                type: "zkp_proof",
                proof_hash: proofHash,
                public_input: body.challenge_id,
                created_at: Date.now(),
              }),
            )
            .run();

          return new Response(
            JSON.stringify({
              ok: true,
              data: {
                id: proofId,
                proof_hash: proofHash,
                public_input: body.challenge_id,
                created_at: Date.now(),
                verified: true,
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
              error: err instanceof Error ? err.message : "Failed to generate proof",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },

      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const proofId = url.searchParams.get("id");
          const challengeId = url.searchParams.get("challenge_id");

          if (!proofId && !challengeId) {
            return new Response(
              JSON.stringify({ ok: false, error: "Proof ID or Challenge ID required" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
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
            return new Response(JSON.stringify({ ok: false, error: "Proof not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(
            JSON.stringify({
              ok: true,
              data: proof,
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
              error: err instanceof Error ? err.message : "Failed to verify proof",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
