#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * Usage:
 *   node scripts/migrate.mjs <command>
 * 
 * Commands:
 *   generate  - Generate new migration from schema
 *   migrate   - Run pending migrations
 *   status    - Show migration status
 *   reset     - Reset database (WARNING: deletes all data)
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

const MIGRATIONS_DIR = "./drizzle/migrations";
const COMMAND = process.argv[2];

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
}

function generateMigration() {
  console.log("Generating migration from schema...");
  const result = runCommand("npx drizzle-kit generate");
  if (result) {
    console.log("Migration generated successfully!");
    console.log(result);
  }
}

function runMigrations() {
  console.log("Running migrations...");
  
  if (!existsSync(MIGRATIONS_DIR)) {
    console.log("No migrations directory found. Run 'generate' first.");
    return;
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migrations to run.");
    return;
  }

  console.log(`Found ${files.length} migration(s):`);
  files.forEach(f => console.log(`  - ${f}`));
  
  console.log("\nTo run migrations on Cloudflare D1:");
  console.log("  npx wrangler d1 execute cyberai-db --remote --file=./drizzle/migrations/<filename>.sql");
}

function showStatus() {
  console.log("Migration Status");
  console.log("================");
  
  if (!existsSync(MIGRATIONS_DIR)) {
    console.log("No migrations directory found.");
    return;
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migrations generated yet.");
    return;
  }

  console.log(`\nGenerated migrations (${files.length}):`);
  files.forEach(f => {
    const content = readFileSync(join(MIGRATIONS_DIR, f), "utf-8");
    const lines = content.split("\n").filter(l => l.trim().startsWith("CREATE") || l.trim().startsWith("ALTER"));
    console.log(`  ${f} (${lines.length} statements)`);
  });
}

function resetDatabase() {
  console.log("⚠️  WARNING: This will delete all data!");
  console.log("Use 'npx wrangler d1 execute cyberai-db --command \"DROP TABLE IF EXISTS ...\"' instead.");
}

switch (COMMAND) {
  case "generate":
    generateMigration();
    break;
  case "migrate":
    runMigrations();
    break;
  case "status":
    showStatus();
    break;
  case "reset":
    resetDatabase();
    break;
  default:
    console.log("Usage: node scripts/migrate.mjs <command>");
    console.log("Commands: generate, migrate, status, reset");
}
