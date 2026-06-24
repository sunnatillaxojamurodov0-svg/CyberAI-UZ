#!/usr/bin/env node

/**
 * Database Seed Script
 * 
 * Usage:
 *   node scripts/seed.mjs
 * 
 * Seeds the database with initial test data:
 *   - Test user
 *   - Sample challenges
 *   - Leaderboard entries
 */

import { execSync } from "child_process";

const DB_NAME = "cyberai-db";

function runD1Command(command) {
  try {
    const result = execSync(`npx wrangler d1 execute ${DB_NAME} --remote --command "${command}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    return result;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
}

async function seed() {
  console.log("🌱 Seeding database...\n");

  const testUserId = "test-user-001";
  const testUserEmail = "test@cyberaiuz.workers.dev";
  const testUserName = "Test Operator";
  const now = Math.floor(Date.now() / 1000);

  console.log("1️⃣ Creating test user...");
  runD1Command(`
    INSERT OR IGNORE INTO users (id, email, password_hash, name, email_verified, created_at, updated_at) 
    VALUES ('${testUserId}', '${testUserEmail}', 'test:placeholder', '${testUserName}', 1, ${now}, ${now})
  `);

  console.log("2️⃣ Creating sample challenges...");
  const challenges = [
    {
      id: "ch-001",
      name: "WEB: SQL Injection",
      difficulty: 1,
      category: "web",
      scenario: "A login form at target.cyberai.local has a SQL injection vulnerability. Enumerate the application and exploit the vulnerability to retrieve the hidden flag.",
      objectives: JSON.stringify(["Enumerate the target", "Find the SQL injection point", "Exploit and retrieve flag"]),
      flag: "CTF{sql_1nj3ct10n_f0und}",
    },
    {
      id: "ch-002",
      name: "CRYPTO: Caesar Cipher",
      difficulty: 1,
      category: "crypto",
      scenario: "You intercepted an encrypted message using Caesar cipher. The encrypted text is: KHOOR ZRUOG. Decode it to reveal the flag.",
      objectives: JSON.stringify(["Identify the cipher", "Determine the shift value", "Decrypt the message"]),
      flag: "CTF{c43s4r_c1ph3r_d3c0d3d}",
    },
    {
      id: "ch-003",
      name: "FORENSICS: PCAP Analysis",
      difficulty: 2,
      category: "forensics",
      scenario: "A suspicious network capture was found. Analyze the pcap file to uncover the hidden flag transmitted over HTTP.",
      objectives: JSON.stringify(["Open the pcap file", "Filter HTTP traffic", "Extract the flag"]),
      flag: "CTF{pc4p_4n4lys1s_c0mpl3t3}",
    },
    {
      id: "ch-004",
      name: "REVERSE: Binary Analysis",
      difficulty: 2,
      category: "reverse",
      scenario: "A binary executable contains a hidden flag. Reverse engineer the binary to extract it.",
      objectives: JSON.stringify(["Run the binary", "Analyze strings", "Find the flag"]),
      flag: "CTF{r3v3rs3_3ng1n33r1ng}",
    },
    {
      id: "ch-005",
      name: "WEB: XSS Challenge",
      difficulty: 2,
      category: "web",
      scenario: "A comment system has a stored XSS vulnerability. Inject a script to capture the admin's session cookie.",
      objectives: JSON.stringify(["Find the injection point", "Craft the XSS payload", "Capture the flag"]),
      flag: "CTF{xss_p4yl04d_d3l1v3r3d}",
    },
    {
      id: "ch-006",
      name: "PWN: Buffer Overflow",
      difficulty: 3,
      category: "pwn",
      scenario: "A service running on port 1337 has a buffer overflow vulnerability. Exploit it to gain shell access and read the flag.",
      objectives: JSON.stringify(["Find the overflow", "Craft the payload", "Get shell and read flag"]),
      flag: "CTF{buff3r_0v3rfl0w_pwn3d}",
    },
    {
      id: "ch-007",
      name: "WEB: CSRF Attack",
      difficulty: 2,
      category: "web",
      scenario: "A password change form lacks CSRF protection. Craft a malicious page to change the admin's password.",
      objectives: JSON.stringify(["Analyze the form", "Create CSRF payload", "Execute the attack"]),
      flag: "CTF{csrf_4tt4ck_succ3ssful}",
    },
    {
      id: "ch-008",
      name: "CRYPTO: RSA Weak Key",
      difficulty: 3,
      category: "crypto",
      scenario: "An RSA implementation uses a weak public exponent. Factor the modulus to recover the private key.",
      objectives: JSON.stringify(["Extract public key", "Factor the modulus", "Decrypt the message"]),
      flag: "CTF{rs4_w34k_k3y_f4ct0r3d}",
    },
    {
      id: "ch-009",
      name: "MISC: Steganography",
      difficulty: 2,
      category: "misc",
      scenario: "An image file contains hidden data. Use steganography tools to extract the flag.",
      objectives: JSON.stringify(["Analyze the image", "Extract hidden data", "Decode the flag"]),
      flag: "CTF{st3g0_3xtr4ct3d}",
    },
    {
      id: "ch-010",
      name: "WEB: IDOR Vulnerability",
      difficulty: 2,
      category: "web",
      scenario: "An API endpoint has an Insecure Direct Object Reference. Manipulate the ID parameter to access other users' data.",
      objectives: JSON.stringify(["Identify the IDOR", "Manipulate the request", "Access unauthorized data"]),
      flag: "CTF{1d0r_d4t4_4cc3ss3d}",
    },
  ];

  for (const ch of challenges) {
    runD1Command(`
      INSERT OR IGNORE INTO challenges (id, name, difficulty, category, scenario, objectives, flag, created_at) 
      VALUES ('${ch.id}', '${ch.name}', ${ch.difficulty}, '${ch.category}', '${ch.scenario.replace(/'/g, "''")}', '${ch.objectives}', '${ch.flag}', ${now})
    `);
  }

  console.log("3️⃣ Creating sample user challenges...");
  for (const ch of challenges.slice(0, 3)) {
    runD1Command(`
      INSERT OR IGNORE INTO user_challenges (user_id, challenge_id, assigned_at, status) 
      VALUES ('${testUserId}', '${ch.id}', ${now}, 'pending')
    `);
  }

  console.log("4️⃣ Creating sample leaderboard entries...");
  const leaderboardEntries = [
    { userId: "user-001", challengeId: "ch-001", score: 100, timeSeconds: 120 },
    { userId: "user-002", challengeId: "ch-002", score: 85, timeSeconds: 180 },
    { userId: "user-003", challengeId: "ch-003", score: 90, timeSeconds: 150 },
  ];

  for (const entry of leaderboardEntries) {
    runD1Command(`
      INSERT OR IGNORE INTO leaderboard (user_id, challenge_id, score, time_seconds, tools_used, solved_at) 
      VALUES ('${entry.userId}', '${entry.challengeId}', ${entry.score}, ${entry.timeSeconds}, '["nmap","sqlmap"]', ${now})
    `);
  }

  console.log("\n✅ Seed completed!");
  console.log("\nTest user:");
  console.log(`  Email: ${testUserEmail}`);
  console.log(`  Password: (any password works for test)`);
  console.log("\nSample challenges: 10");
  console.log("Leaderboard entries: 3");
}

seed().catch(console.error);
