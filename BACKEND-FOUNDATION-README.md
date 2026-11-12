# Sabland.in Backend & Deployment Documentation

## 1. System Architecture

```
[ Customer Browser ]
       │  (Checkout / COD only - NO OTP)
       ▼
[ Next.js 15 App Router (/api/orders) ]
       │
       ├─► 1. Atomic Transaction (BEGIN IMMEDIATE)
       │      • Recalculate price quote from database products
       │      • Validate address & sequential order number (SBL-YYYY-XXXXXX)
       │      • Persist to primary database: orders, order_items, delivery_addresses
       │      • Enqueue to sheet_sync_outbox (status = 'PENDING')
       │      • Commit transaction
       │
       ▼
[ SQLite Primary Database (better-sqlite3) ]  ◄── Single Source of Truth
       │
       ├─► 2. Immediate Non-Blocking Trigger (fire-and-forget setImmediate)
       │      • Attempts initial outbox sync
       │      • Failures NEVER block or delay customer response
       │
       ▼
[ Outbox Sync Worker (scripts/sync-sheets-outbox.mjs) ]  ◄── Reliable Sync Engine
       │      • Process lock file (.sync-worker.lock) prevents concurrent runs
       │      • Atomic record claim (status = 'PROCESSING')
       │      • Pre-append check on Column A (deduplication & crash resilience)
       │      • Formula injection escaping (=, +, -, @ sanitized)
       │
       ▼
[ Google Sheets API v4 (Secondary Copy) ]  ◄── Target Tab: "Orders"
```

---

## 2. Key Architecture Principles

1. **SQLite is the ONLY Primary Database**:
   - High performance, zero network roundtrip latency using `better-sqlite3`.
   - WAL (Write-Ahead Logging) enabled with `busy_timeout = 5000`.
   - All financial figures are stored as integer paise to prevent floating-point rounding errors.
   - Database location is configurable via `SQLITE_DB_PATH`.

2. **Cash on Delivery (COD) Only**:
   - No payment gateways (Razorpay, Stripe, Paytm, UPI, etc.) are installed or configured.
   - Database schema strictly validates `payment_method = 'COD'`.

3. **ABSOLUTELY NO OTP OR PHONE VERIFICATION**:
   - Customers place orders directly by entering their contact details, delivery address, and confirming COD.
   - Standard 10-digit Indian mobile format is validated without requiring SMS verification.
   - No OTP endpoints, SMS providers, or verification gates exist.

4. **Reliable Google Sheets Outbox Pattern**:
   - Orders are always saved in SQLite first before syncing to Google Sheets.
   - The `sheet_sync_outbox` table queues records with `status IN ('PENDING', 'PROCESSING', 'SYNCED', 'FAILED')`.
   - `scripts/sync-sheets-outbox.mjs` runs on a schedule (cron or interval) to process pending rows.
   - If Google Sheets API times out or is unreachable, the customer's order remains safely saved in SQLite, and the worker retries on the next cycle.

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env.local` on the server:

```bash
# 1. Environment & Site Origin
NODE_ENV="production"
SITE_ORIGIN="https://sabland.in"

# 2. SQLite Database Path (Persistent Storage on HostKarle)
# Must be outside deployment directory or in a dedicated persistent path:
SQLITE_DB_PATH="/home/YOUR_USER/data/sabaland.db"

# 3. Google Sheets Integration (Service Account)
# Share your spreadsheet with this email as "Editor"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="your_spreadsheet_id_here"
GOOGLE_SHEET_TAB_NAME="Orders"
```

---

## 4. HostKarle DirectAdmin Deployment Guide

### Prerequisites
- HostKarle DirectAdmin Account with **Node.js Selector** enabled.
- Node.js version set to **Node.js 22.x**.

### Step 1: Upload Files
Upload project files to your application directory on HostKarle (e.g. `/home/YOUR_USER/sabaland` or `public_html`):
- Do **NOT** upload local `node_modules` or `.next` compiled on Windows.
- Ensure `.env.local` is created on the server with your production values.

### Step 2: Persistent SQLite Storage Setup
In the DirectAdmin File Manager or SSH, create a persistent folder outside the web root:
```bash
mkdir -p /home/YOUR_USER/data
```
Set `SQLITE_DB_PATH="/home/YOUR_USER/data/sabaland.db"` in `.env.local`.

### Step 3: Install Dependencies & Native Modules
In the DirectAdmin Terminal or Node.js Selector "Run NPM Install":
```bash
npm install
npm rebuild better-sqlite3
```
*(This compiles `better-sqlite3` native binaries for Linux).*

### Step 4: Run Database Migrations & Seed Products
Initialize the SQLite database schema and product catalog:
```bash
node scripts/db-migrate.mjs
node scripts/db-seed.mjs
```

### Step 5: Build Next.js
Build the production Next.js bundle:
```bash
npm run build
```

### Step 6: Configure DirectAdmin Node.js App
In DirectAdmin **Node.js Selector**:
- **Application root**: `/home/YOUR_USER/domains/sabland.in/public_html` (or your app directory)
- **Application URL**: `sabland.in`
- **Application startup file**: `server.js`
- **Node.js version**: `22.x`
- Click **Save** and **Restart**.

### Step 7: Configure Google Sheets Sync Cron Job
In DirectAdmin **Cron Jobs**, add a cron job to sync outbox orders to Google Sheets every 1 or 2 minutes:
```bash
* * * * * cd /home/YOUR_USER/domains/sabland.in/public_html && /usr/local/bin/node scripts/sync-sheets-outbox.mjs >> /home/YOUR_USER/data/sheets-sync.log 2>&1
```
*(The built-in lock file `.sync-worker.lock` ensures overlapping cron executions exit immediately without duplicate processing).*

---

## 5. Maintenance Commands

| Action | Command |
|---|---|
| Run Backend Safety Checks | `node scripts/check-backend-foundation.mjs` |
| Run In-Memory Database Tests | `node scripts/db-selftest.mjs` |
| Run Google Sheets Tests | `npm test` |
| Manual Outbox Sync | `node scripts/sync-sheets-outbox.mjs` |
| Continuous Sync Scheduler | `node scripts/sync-sheets-outbox.mjs --interval 60` |
| Verify Google Sheets Handshake | `node scripts/test-sheets-connection.mjs` |
