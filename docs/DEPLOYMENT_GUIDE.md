# Cloud Deployment, DevOps & Disaster Recovery Guide
## Order Control System — Multi-Brand Dark Kitchen Operating Platform

> **Printable Edition:** [📥 Download Executive PDF (A4 Edition)](PDFs/DEPLOYMENT_GUIDE.pdf)  
> **Deployment Target:** Vercel (Edge & Serverless) + Supabase (PostgreSQL 15+)  
> **Status:** Production-Ready | **Revision:** September 2026

---

## Table of Contents
1. [Cloud Topology & Infrastructure Overview](#1-cloud-topology--infrastructure-overview)
2. [Environment Variables & Secrets Specification](#2-environment-variables--secrets-specification)
3. [Database Migration Pipeline](#3-database-migration-pipeline)
4. [High-Concurrency Connection Pooling & Tuning](#4-high-concurrency-connection-pooling--tuning)
5. [Disaster Recovery & Backup Protocols (DR)](#5-disaster-recovery--backup-protocols-dr)
6. [First-Time Owner Provisioning Bootstrap](#6-first-time-owner-provisioning-bootstrap)
7. [Observability, Health Checks & Runbooks](#7-observability-health-checks--runbooks)

---

## 1. Cloud Topology & Infrastructure Overview

The Order Control System is architected for zero-maintenance, serverless elasticity. It decouples edge presentation from relational persistence:

```
[ Kitchen Terminals & Cashier POS ]
                 │ (HTTPS / WSS)
                 ▼
     [ Vercel Edge Network ]
  ┌─────────────────────────────┐
  │ Next.js 16 App Router       │
  │ • Server-Side Rendering     │
  │ • Edge Middleware (Proxy)   │
  │ • 40 Serverless API Routes  │
  └──────────────┬──────────────┘
                 │
   ┌─────────────┴─────────────┐
   │ Runtime Queries           │ Migrations / DDL
   │ Port :6543 (Pooler)       │ Port :5432 (Session)
   ▼                           ▼
[ Supabase PgBouncer Pooler ]  [ Direct Postgres Instance ]
  └──────────────┬─────────────┘
                 ▼
  [ Supabase PostgreSQL 15+ ]
  • ACID Relational Storage
  • Row-Level Security (Deny-All)
  • Automated Daily PITR Backups
```

---

## 2. Environment Variables & Secrets Specification

Production deployments require six core environment variables configured in the Vercel Project Settings:

| Environment Variable | Target / Scope | Format & Example | Operational Purpose |
|---|:---:|---|---|
| `DATABASE_URL` | Server Only | `postgresql://postgres.[ref]:[pwd]@[host]:6543/postgres?pgbouncer=true` | Runtime transactional queries via PgBouncer Pooler |
| `DIRECT_URL` | Build / Server | `postgresql://postgres.[ref]:[pwd]@[host]:5432/postgres` | Dedicated session connection for Prisma Migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Universal | `https://[project-ref].supabase.co` | Supabase API endpoint for browser & server auth |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser | `eyJhbGciOi...` | Anonymous public key for client-side session renewal |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | `eyJhbGciOi...` | Administrative key for user provisioning & management |
| `OWNER_EMAIL` | Server Only | `owner@sushi.local` | Designates initial administrator during bootstrap |

> ⚠️ **Critical Security Directives:**
> - Never expose `SUPABASE_SERVICE_ROLE_KEY` or `DIRECT_URL` to browser clients.
> - Ensure `.env` is listed in `.gitignore` to prevent secret leaks to GitHub.

---

## 3. Database Migration Pipeline

Because the runtime connection `DATABASE_URL` uses PgBouncer in transaction mode (`:6543`), schema migrations and table alterations cannot run through the pooler. Prisma must use `DIRECT_URL` (`:5432`).

### Automated CI/CD Migration Execution
During Vercel production builds or CI deployment pipelines, execute:

```bash
# 1. Apply all pending migrations safely to production
npx prisma migrate deploy

# 2. Generate updated Prisma 7 client bindings
npx prisma generate

# 3. Build Next.js application with Turbopack
npm run build
```

### Creating New Schema Migrations Locally
When altering `prisma/schema.prisma` during development:

```bash
# Creates migration SQL file and applies it to dev database
npx prisma migrate dev --name <descriptive_name>
```

---

## 4. High-Concurrency Connection Pooling & Tuning

During kitchen rush hours (6:00 PM – 11:00 PM), dozens of orders may arrive concurrently. To eliminate pool exhaustion and database timeouts, the system enforces the following parameters in `src/lib/prisma.ts`:

```typescript
// Interactive Transaction Timeout Configuration
export const TRANSACTION_OPTIONS = {
  maxWait: 15000, // Maximum time waiting for pool slot (15s)
  timeout: 25000, // Maximum transaction lifetime before rollback (25s)
};
```

### Supabase Connection Pool Settings (Dashboard > Settings > Database)
- **Pool Mode:** `Transaction` (Mandatory for serverless scaling).
- **Default Pool Size:** `15 – 20` connections.
- **Max Client Connections:** `100+`.

---

## 5. Disaster Recovery & Backup Protocols (DR)

### Strategy 1: Automated Point-In-Time Recovery (PITR)
Supabase Pro tiers execute continuous WAL archiving allowing second-by-second rollbacks up to 7 days:
- **Recovery Point Objective (RPO):** < 1 minute of data.
- **Recovery Time Objective (RTO):** < 15 minutes.
- **Trigger:** Initiated via Supabase Dashboard (`Database > Backups > Restore`).

### Strategy 2: Manual Cold Snapshot (Pre-Deployment Safeguard)
Before executing high-risk schema migrations or large menu re-categorizations, take a manual database dump:

```bash
# Create timestamped SQL snapshot
pg_dump -d "$DIRECT_URL" -F c -b -v -f "backup_pre_deploy_$(date +%Y%m%d_%H%M%S).dump"

# Restore command in case of catastrophic migration failure
pg_restore -d "$DIRECT_URL" -v --clean "backup_pre_deploy_20260916_180000.dump"
```

---

## 6. First-Time Owner Provisioning Bootstrap

When launching a clean production instance:
1. Set the `OWNER_EMAIL` variable in Vercel to the owner's primary email address (e.g. `owner@sushi.local`).
2. Navigate to the `/login` page and sign in or execute initial signup.
3. The authentication hook in `src/lib/auth.ts` intercepts the login: if the user matches `OWNER_EMAIL` and no active owner exists, it automatically elevates the role to `OWNER`.
4. Subsequent staff accounts (Managers, Cashiers) are provisioned directly by the Owner from the `/users` dashboard.

---

## 7. Observability, Health Checks & Runbooks

### Automated Health Verification
Deployments can be continuously monitored by pinging the lookups endpoint:
- **Health Endpoint:** `GET /api/lookups`
- **Expected Status:** `200 OK`
- **Payload Validation:** Returns active `brands` and `platforms`. A failure indicates database pool exhaustion or credentials expiration.

### Operational Incident Checklist

| Symptom | Root Cause | Remediation Procedure |
|---|---|---|
| `P2024: Timed out fetching a new connection` | PgBouncer pool saturated | Increase Supabase Pool Size or adjust serverless function concurrency limits. |
| `P2028: Transaction API error: Transaction already closed` | Long-running query exceeded 25s timeout | Optimize query indexes or split multi-table reporting aggregations into batches. |
| `401 Unauthorized across all pages` | Stale or invalidated Supabase Auth cookie | User must sign out and clear cookies, or verify Supabase project API keys in Vercel. |
| `Duplicate key error on orderNumber` | PostgreSQL Advisory Lock bypassed | Ensure all order creations invoke `src/services/orders.ts` and never bypass the service layer. |

---
*Official Production Deployment Runbook for Order Control System. Maintained by Infrastructure & DevOps Engineering.*
