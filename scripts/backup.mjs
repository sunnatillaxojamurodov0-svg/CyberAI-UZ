#!/usr/bin/env node

/**
 * Backup Script
 *
 * Usage:
 *   node scripts/backup.mjs [type]
 *
 * Types:
 *   all       - Backup everything
 *   database  - Backup D1 database
 *   config    - Backup configuration files
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const BACKUP_DIR = "./backups";
const DATE = new Date().toISOString().split("T")[0];
const TYPE = process.argv[2] || "all";

function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
}

async function backupDatabase() {
  console.log("📦 Backing up database...");
  const outputFile = join(BACKUP_DIR, `cyberai-db-${DATE}.sql`);
  const result = runCommand(`npx wrangler d1 export cyberai-db --output ${outputFile}`);
  if (result) {
    console.log(`  ✅ Database exported to ${outputFile}`);
  }
}

async function backupConfig() {
  console.log("📦 Backing up configuration...");
  const outputFile = join(BACKUP_DIR, `config-${DATE}.tar.gz`);
  const result = runCommand(
    `tar -czf ${outputFile} wrangler.jsonc drizzle/ .dev.vars docker-proxy/ 2>/dev/null`,
  );
  if (result !== null) {
    console.log(`  ✅ Configuration exported to ${outputFile}`);
  }
}

async function backupAll() {
  ensureBackupDir();
  console.log(`\n🔄 Starting backup (${DATE})\n`);

  await backupDatabase();
  await backupConfig();

  console.log("\n✅ Backup completed!");
  console.log(`📁 Backups stored in: ${BACKUP_DIR}/`);
}

switch (TYPE) {
  case "database":
    ensureBackupDir();
    backupDatabase();
    break;
  case "config":
    ensureBackupDir();
    backupConfig();
    break;
  case "all":
  default:
    backupAll();
}
