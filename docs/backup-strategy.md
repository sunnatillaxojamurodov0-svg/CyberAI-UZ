# Backup Strategy

## Overview

This document outlines the backup and recovery strategy for the CyberAI platform, covering database, configuration, and application data.

## Backup Types

### 1. Database Backups (D1)

**Frequency:** Daily automated + Manual before deployments

**What to backup:**
- `cyberai-db` — All tables (users, sessions, challenges, etc.)

**Methods:**

#### Manual Export
```bash
# Export full database
npx wrangler d1 export cyberai-db --output ./backups/cyberai-db-$(date +%Y%m%d).sql

# Export specific table
npx wrangler d1 execute cyberai-db --command "SELECT * FROM users" --output ./backups/users-$(date +%Y%m%d).json
```

#### Automated (via GitHub Actions)
```yaml
# .github/workflows/backup.yml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Export D1
        run: |
          npx wrangler d1 export cyberai-db --output ./backup-$(date +%Y%m%d).sql
      - name: Upload to R2
        run: |
          npx wrangler r2 object put cyberai-backups/backup-$(date +%Y%m%d).sql -f ./backup-$(date +%Y%m%d).sql
```

### 2. KV Namespace Backups

**Frequency:** Weekly

**What to backup:**
- `CYBERAI_KV` — Cache, sessions, temporary data

**Method:**
```bash
# List all keys
npx wrangler kv key list --namespace-id=31c6e4512cd34d97b2c27839f558b100

# Export key-value pairs
npx wrangler kv key get <key> --namespace-id=31c6e4512cd34d97b2c27839f558b100
```

### 3. Configuration Backups

**Frequency:** On every change

**What to backup:**
- `wrangler.jsonc` — Worker configuration
- `drizzle/schema.ts` — Database schema
- `.dev.vars` — Environment variables (encrypted)
- `docker-proxy/` — Docker configuration

**Method:**
```bash
# Git commit (automatic)
git add -A
git commit -m "config: backup configuration"

# Manual export
tar -czf config-backup-$(date +%Y%m%d).tar.gz wrangler.jsonc drizzle/ .dev.vars docker-proxy/
```

### 4. Application Code Backups

**Frequency:** On every deployment

**What to backup:**
- `src/` — Application source code
- `package.json` — Dependencies
- `dist/` — Built assets

**Method:**
```bash
# Git tag on deployment
git tag -a v$(date +%Y%m%d-%H%M%S) -m "Deployment backup"
git push origin --tags
```

## Recovery Procedures

### 1. Database Recovery

#### Restore from Backup
```bash
# Restore full database
npx wrangler d1 execute cyberai-db --file ./backups/cyberai-db-20240101.sql

# Restore specific table
npx wrangler d1 execute cyberai-db --file ./backups/users-20240101.sql
```

#### Point-in-Time Recovery
```bash
# Export current state
npx wrangler d1 export cyberai-db --output ./pre-restore.sql

# Restore from backup
npx wrangler d1 execute cyberai-db --file ./backups/cyberai-db-20240101.sql

# Verify restore
npx wrangler d1 execute cyberai-db --command "SELECT COUNT(*) FROM users"
```

### 2. Configuration Recovery

#### Restore from Git
```bash
# List recent commits
git log --oneline -10

# Restore specific file
git checkout <commit-hash> -- wrangler.jsonc

# Restore all config
git checkout <commit-hash> -- wrangler.jsonc drizzle/ .dev.vars
```

#### Restore from Backup
```bash
# Extract backup
tar -xzf config-backup-20240101.tar.gz

# Verify files
ls -la wrangler.jsonc drizzle/ .dev.vars
```

### 3. Application Recovery

#### Redeploy Previous Version
```bash
# List deployments
git tag -l

# Deploy specific version
git checkout v20240101-143000
npm run build
npx wrangler deploy
```

#### Rollback
```bash
# Find last working commit
git log --oneline -5

# Reset to that commit
git reset --hard <commit-hash>

# Force push (WARNING: destroys history)
git push origin main --force
```

## Backup Schedule

| Type | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Database | Daily | 30 days | R2 |
| KV | Weekly | 14 days | R2 |
| Config | On change | Git history | GitHub |
| Code | On deploy | Git tags | GitHub |

## Monitoring

### Backup Status
```bash
# Check R2 backups
npx wrangler r2 object list cyberai-backups/

# Check last backup
npx wrangler r2 object get cyberai-backups/backup-$(date +%Y%m%d).sql --output ./check.sql
```

### Alerts
- Failed backup → GitHub Actions notification
- Database size > 100MB → Warning
- Backup age > 48 hours → Critical

## Security Considerations

1. **Encryption** — Backups stored in R2 are encrypted at rest
2. **Access Control** — R2 bucket has restricted access
3. **Secrets** — Never backup `.dev.vars` to public repos
4. **Retention** — Old backups auto-deleted after retention period

## Disaster Recovery

### Scenario 1: Database Corruption
1. Export current state (if possible)
2. Restore from latest backup
3. Verify data integrity
4. Notify affected users

### Scenario 2: Code Deployment Failure
1. Identify last working deployment
2. `git revert` or `git reset`
3. `npm run build && npx wrangler deploy`
4. Verify functionality

### Scenario 3: Complete Data Loss
1. Restore database from R2 backup
2. Restore KV from backup
3. Redeploy application
4. Verify all services
5. Notify users of incident

## Scripts

```bash
# Create backup
node scripts/backup.mjs

# Restore backup
node scripts/restore.mjs <backup-file>

# Check backup status
node scripts/backup-status.mjs
```
