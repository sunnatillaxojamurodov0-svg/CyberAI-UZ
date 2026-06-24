#!/usr/bin/env node

/**
 * Restore Script
 * 
 * Usage:
 *   node scripts/restore.mjs <backup-file>
 * 
 * Examples:
 *   node scripts/restore.mjs ./backups/cyberai-db-20240101.sql
 *   node scripts/restore.mjs ./backups/config-20240101.tar.gz
 */

import { execSync } from "child_process";
import { existsSync } from "fs";

const BACKUP_FILE = process.argv[2];

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return null;
  }
}

async function restoreDatabase(filePath) {
  console.log("🔄 Restoring database...");
  const result = runCommand(`npx wrangler d1 execute cyberai-db --file ${filePath}`);
  if (result !== null) {
    console.log("  ✅ Database restored successfully");
  }
}

async function restoreConfig(filePath) {
  console.log("🔄 Restoring configuration...");
  const result = runCommand(`tar -xzf ${filePath}`);
  if (result !== null) {
    console.log("  ✅ Configuration restored successfully");
  }
}

async function restore() {
  if (!BACKUP_FILE) {
    console.log("Usage: node scripts/restore.mjs <backup-file>");
    console.log("Examples:");
    console.log("  node scripts/restore.mjs ./backups/cyberai-db-20240101.sql");
    console.log("  node scripts/restore.mjs ./backups/config-20240101.tar.gz");
    return;
  }

  if (!existsSync(BACKUP_FILE)) {
    console.error(`Backup file not found: ${BACKUP_FILE}`);
    return;
  }

  console.log(`\n🔄 Restoring from: ${BACKUP_FILE}\n`);

  if (BACKUP_FILE.endsWith(".sql")) {
    await restoreDatabase(BACKUP_FILE);
  } else if (BACKUP_FILE.endsWith(".tar.gz")) {
    await restoreConfig(BACKUP_FILE);
  } else {
    console.error("Unsupported backup format. Use .sql or .tar.gz");
  }
  
  console.log("\n✅ Restore completed!");
}

restore().catch(console.error);
