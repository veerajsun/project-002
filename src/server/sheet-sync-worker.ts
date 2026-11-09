import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getDatabase } from "./db";
import {
  createSheetsClient,
  ensureHeaderRow,
  appendOrderRows,
  findExistingOrderNumbers,
} from "./sheets-client";
import { mapOrderToSheetRow, parseOutboxPayload } from "./sheets-mapper";
import { getSqliteDbPath, isGoogleSheetsConfigured } from "./env";

if (typeof window !== "undefined") {
  throw new Error("src/server/sheet-sync-worker.ts must never be loaded in the browser");
}

export type OutboxRow = {
  id: string;
  order_id: string;
  payload_json: string;
  status: "PENDING" | "PROCESSING" | "SYNCED" | "FAILED";
  attempts: number;
};

export type SyncResultDetail = {
  id: string;
  orderNumber: string;
  status: "SYNCED" | "SKIPPED_DUPLICATE" | "FAILED";
  error?: string;
};

export type SyncBatchResult = {
  processed: number;
  synced: number;
  skipped: number;
  failed: number;
  details: SyncResultDetail[];
};

export class LockAcquisitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LockAcquisitionError";
  }
}

/**
 * Acquires a cross-process lock file using exclusive creation flags.
 * Returns a release function, or throws LockAcquisitionError if another process holds the lock.
 */
export function acquireWorkerLock(lockFilePath?: string): () => void {
  const defaultPath = path.resolve(
    path.dirname(getSqliteDbPath() === ":memory:" ? "./data/sabaland.db" : getSqliteDbPath()),
    ".sync-worker.lock"
  );
  const targetPath = lockFilePath || defaultPath;

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  let fd: number;
  try {
    fd = fs.openSync(targetPath, "wx");
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, time: new Date().toISOString() }));
  } catch (err: any) {
    if (err.code === "EEXIST") {
      // Check if the process holding the lock is still alive
      try {
        const raw = fs.readFileSync(targetPath, "utf8");
        const info = JSON.parse(raw);
        if (info?.pid && typeof info.pid === "number") {
          try {
            // process.kill with signal 0 checks if process exists without sending a signal
            process.kill(info.pid, 0);
            throw new LockAcquisitionError(
              `Sync worker is already running (PID: ${info.pid}, started: ${info.time})`
            );
          } catch (probeErr: any) {
            if (probeErr.code === "ESRCH") {
              // Stale lock from a dead process, safe to reclaim
              fs.unlinkSync(targetPath);
              fd = fs.openSync(targetPath, "wx");
              fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, time: new Date().toISOString() }));
            } else {
              throw probeErr;
            }
          }
        }
      } catch (readErr: any) {
        if (readErr instanceof LockAcquisitionError) throw readErr;
        throw new LockAcquisitionError("Sync worker lock is currently held by another process.");
      }
    } else {
      throw err;
    }
  }

  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    try {
      if (fd !== undefined) fs.closeSync(fd);
    } catch {}
    try {
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
    } catch {}
  };

  process.once("exit", release);

  return release;
}

/**
 * Resets stale PROCESSING records back to PENDING.
 * This recovers records that were interrupted mid-flight by an ungraceful crash or server kill.
 */
export function recoverStaleProcessing(
  db: InstanceType<typeof Database>,
  staleThresholdMs = 5 * 60 * 1000
): number {
  const cutoff = new Date(Date.now() - staleThresholdMs).toISOString();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE sheet_sync_outbox
       SET status = 'PENDING',
           updated_at = ?
     WHERE status = 'PROCESSING'
       AND updated_at <= ?
  `);

  const result = stmt.run(now, cutoff);
  return result.changes;
}

/**
 * Atomically claims an outbox record for processing.
 * Returns true if the record was successfully claimed (changes === 1), false otherwise.
 */
export function claimRecord(
  db: InstanceType<typeof Database>,
  id: string
): boolean {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE sheet_sync_outbox
       SET status = 'PROCESSING',
           attempts = attempts + 1,
           updated_at = ?
     WHERE id = ?
       AND status IN ('PENDING', 'FAILED')
  `);

  const result = stmt.run(now, id);
  return result.changes === 1;
}

/**
 * Updates an outbox record to SYNCED status upon successful append or duplicate skip.
 */
export function markRecordSynced(
  db: InstanceType<typeof Database>,
  id: string
): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE sheet_sync_outbox
       SET status = 'SYNCED',
           last_error = NULL,
           updated_at = ?
     WHERE id = ?
  `).run(now, id);
}

/**
 * Updates an outbox record to FAILED status upon an unhandled sync error, storing the error message.
 */
export function markRecordFailed(
  db: InstanceType<typeof Database>,
  id: string,
  errorMessage: string
): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE sheet_sync_outbox
       SET status = 'FAILED',
           last_error = ?,
           updated_at = ?
     WHERE id = ?
  `).run(errorMessage, now, id);
}

export type SyncOutboxOptions = {
  db?: InstanceType<typeof Database>;
  sheetsClient?: any;
  spreadsheetId?: string;
  tabName?: string;
  batchSize?: number;
  staleThresholdMs?: number;
};

/**
 * Processes a batch of pending and failed outbox records:
 * 1. Ensures the target Google Sheet header row is present.
 * 2. Recovers any stale PROCESSING records from previous crashed runs.
 * 3. Reads eligible PENDING/FAILED outbox records in FIFO order.
 * 4. Checks Column A to skip duplicate appends if already recorded in Google Sheets.
 * 5. Appends new rows and transitions records to SYNCED.
 * 6. Catches and marks failed items as FAILED with error notes without crashing the batch.
 */
export async function syncOutboxBatch(
  options: SyncOutboxOptions = {}
): Promise<SyncBatchResult> {
  const db = options.db || getDatabase();
  const batchSize = options.batchSize || 50;

  // 1. Initialize sheets client & tab configuration
  const service = options.sheetsClient
    ? { sheets: options.sheetsClient, config: { sheetId: options.spreadsheetId!, tabName: options.tabName || "Orders" } }
    : createSheetsClient();

  const sheets = service.sheets;
  const spreadsheetId = options.spreadsheetId || service.config.sheetId;
  const tabName = options.tabName || service.config.tabName || "Orders";

  // Ensure headers exist in the target tab
  await ensureHeaderRow(sheets, spreadsheetId, tabName);

  // 2. Recover stale PROCESSING records from previous crashed executions
  recoverStaleProcessing(db, options.staleThresholdMs);

  // 3. Query eligible PENDING and FAILED records
  const candidateRows = db.prepare(`
    SELECT id, order_id, payload_json, status, attempts
      FROM sheet_sync_outbox
     WHERE status IN ('PENDING', 'FAILED')
     ORDER BY created_at ASC
     LIMIT ?
  `).all(batchSize) as OutboxRow[];

  const result: SyncBatchResult = {
    processed: 0,
    synced: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  if (candidateRows.length === 0) {
    return result;
  }

  // 4. Read Column A once before processing the batch to discover existing orders
  const existingOrderNumbers = await findExistingOrderNumbers(sheets, spreadsheetId, tabName);

  for (const record of candidateRows) {
    // 5. Atomically claim record (single-worker guarantee)
    const claimed = claimRecord(db, record.id);
    if (!claimed) {
      // Record was claimed by another worker or already transitioned
      continue;
    }

    result.processed++;
    let orderNumber = "UNKNOWN";

    try {
      const payload = parseOutboxPayload(record.payload_json);
      orderNumber = payload.orderNumber;

      // 6. Check if order number is already in Google Sheets (recovery/idempotency check)
      if (existingOrderNumbers.has(orderNumber)) {
        markRecordSynced(db, record.id);
        result.skipped++;
        result.details.push({
          id: record.id,
          orderNumber,
          status: "SKIPPED_DUPLICATE",
        });
        continue;
      }

      // 7. Map row and append to Google Sheets
      const sheetRow = mapOrderToSheetRow(payload);
      await appendOrderRows(sheets, spreadsheetId, tabName, [sheetRow]);

      // Add to local set so later records in the same batch won't re-append
      existingOrderNumbers.add(orderNumber);

      markRecordSynced(db, record.id);
      result.synced++;
      result.details.push({
        id: record.id,
        orderNumber,
        status: "SYNCED",
      });
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      markRecordFailed(db, record.id, errorMessage);
      result.failed++;
      result.details.push({
        id: record.id,
        orderNumber,
        status: "FAILED",
        error: errorMessage,
      });
    }
  }

  return result;
}

/**
 * Asynchronously triggers a non-blocking background sync attempt for the outbox.
 * Designed to be called immediately after a successful SQLite order transaction.
 * Failures or delays in Google Sheets API will NEVER block or affect order placement.
 */
export function triggerBackgroundSync(): void {
  // Fire-and-forget: execute on next event loop turn without awaiting
  setImmediate(async () => {
    try {
      if (!isGoogleSheetsConfigured()) {
        return;
      }
      await syncOutboxBatch({ batchSize: 10 });
    } catch (err: any) {
      // Non-blocking: background trigger errors are logged, leaving reliable delivery to the CLI worker
      console.warn(
        "[sheets-sync-trigger] Background sync attempt deferred to worker:",
        err?.message || err
      );
    }
  });
}
