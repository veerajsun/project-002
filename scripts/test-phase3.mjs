import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { root, transpile } from "./_db-utils.mjs";

let passed = 0;
let failed = 0;

function ok(condition, message) {
  console.log(`${condition ? "  ok   " : "  FAIL "} ${message}`);
  if (condition) {
    passed++;
  } else {
    failed++;
  }
}

async function main() {
  console.log("\n==================================================");
  console.log("  Sabaland: Phase 3 Tests (Outbox Sync Worker)");
  console.log("==================================================\n");

  try {
    const outDir = await transpile(
      [
        "src/server/constants.ts",
        "src/server/pricing.ts",
        "src/server/env.ts",
        "src/server/db.ts",
        "src/server/sheets-mapper.ts",
        "src/server/sheets-client.ts",
        "src/server/sheet-sync-worker.ts",
      ],
      "sheets-phase3-tests"
    );

    const compiledFiles = fs
      .readdirSync(outDir)
      .filter((file) => file.endsWith(".mjs"));

    for (const file of compiledFiles) {
      const filePath = path.join(outDir, file);
      const source = fs.readFileSync(filePath, "utf8");
      const fixed = source.replace(
        /(["'])(\.{1,2}\/[^"']+?)(["'])/g,
        (match, quote, specifier, endQuote) => {
          if (path.extname(specifier)) return match;
          return `${quote}${specifier}.mjs${endQuote}`;
        }
      );
      fs.writeFileSync(filePath, fixed);
    }

    const load = (name) => import(pathToFileURL(path.join(outDir, name)).href);

    const workerMod = await load("sheet-sync-worker.mjs");
    const mapperMod = await load("sheets-mapper.mjs");
    const Database = (await import("better-sqlite3")).default;

    // Create an isolated in-memory test database with 001_foundation schema
    const migrationSql = fs.readFileSync(
      path.join(root, "db", "migrations", "001_foundation.sql"),
      "utf8"
    );

    function createTestDb() {
      const db = new Database(":memory:");
      db.pragma("foreign_keys = ON");
      db.exec(migrationSql);
      return db;
    }

    function createSamplePayload(orderNumber = "SBL-2026-000101") {
      return {
        orderNumber,
        status: "NEW",
        paymentMethod: "COD",
        customerName: "Priya Sharma",
        customerPhone: "9876543210",
        address: {
          house: "Apt 5B",
          street: "Park Street",
          landmark: "Near Metro Gate 3",
          city: "Kolkata",
          state: "West Bengal",
          pin: "700016",
        },
        items: [
          { slug: "khalta-500g", name: "Khalta Special 500g", quantity: 2, unitPricePaise: 129900, lineTotalPaise: 259800 },
        ],
        subtotalPaise: 259800,
        savingsPaise: 0,
        shippingPaise: 0,
        totalPaise: 259800,
        createdAt: new Date().toISOString(),
      };
    }

    function insertOrderAndOutbox(db, orderNumber = "SBL-2026-000101", outboxId = "outbox-1", status = "PENDING") {
      const orderId = `order-${orderNumber}`;
      const now = new Date().toISOString();
      const payload = createSamplePayload(orderNumber);

      db.prepare(`
        INSERT INTO orders (
          id, order_number, idempotency_key, request_hash, status,
          payment_method, currency, customer_name, customer_phone,
          subtotal_paise, savings_paise, shipping_paise, total_paise,
          created_at, updated_at
        ) VALUES (?, ?, ?, 'hash', 'NEW', 'COD', 'INR', ?, ?, ?, 0, 0, ?, ?, ?)
      `).run(
        orderId,
        orderNumber,
        `idem-${orderNumber}`,
        payload.customerName,
        payload.customerPhone,
        payload.subtotalPaise,
        payload.totalPaise,
        now,
        now
      );

      db.prepare(`
        INSERT INTO sheet_sync_outbox (
          id, order_id, payload_json, status, attempts, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 0, ?, ?)
      `).run(outboxId, orderId, JSON.stringify(payload), status, now, now);

      return { orderId, payload };
    }

    console.log("--- 1. Successful Outbox Synchronization ---");
    {
      const db = createTestDb();
      insertOrderAndOutbox(db, "SBL-2026-000101", "outbox-101");

      const appendedRows = [];
      const mockSheets = {
        spreadsheets: {
          values: {
            get: async () => ({ data: { values: [mapperMod.ORDER_SHEET_HEADERS] } }),
            append: async ({ requestBody }) => {
              appendedRows.push(...requestBody.values);
              return { data: { updates: { updatedRows: 1 } } };
            },
          },
        },
      };

      const syncResult = await workerMod.syncOutboxBatch({
        db,
        sheetsClient: mockSheets,
        spreadsheetId: "mock-sheet-id",
        tabName: "Orders",
      });

      ok(syncResult.processed === 1, `syncOutboxBatch processed 1 record (got ${syncResult.processed})`);
      ok(syncResult.synced === 1, `syncOutboxBatch synced 1 record (got ${syncResult.synced})`);
      ok(syncResult.skipped === 0, "No duplicate records were skipped");
      ok(syncResult.failed === 0, "No records failed");
      ok(appendedRows.length === 1, "appendOrderRows received exactly 1 row");
      ok(appendedRows[0][0] === "SBL-2026-000101", `Row[0] is orderNumber "${appendedRows[0][0]}"`);
      ok(appendedRows[0][4] === "Priya Sharma", `Row[4] is customerName "${appendedRows[0][4]}"`);
      ok(typeof appendedRows[0][14] === "number" && appendedRows[0][14] === 2598, "Row[14] is numeric total INR 2598");

      // Verify SQLite state
      const updated = db.prepare("SELECT * FROM sheet_sync_outbox WHERE id = ?").get("outbox-101");
      ok(updated.status === "SYNCED", `SQLite record status is SYNCED (got "${updated.status}")`);
      ok(updated.attempts === 1, `SQLite attempts count incremented to 1 (got ${updated.attempts})`);
      ok(updated.last_error === null, "SQLite last_error is null");
    }

    console.log("\n--- 2. Duplicate Append Skipping (Crash Recovery Idempotency) ---");
    {
      const db = createTestDb();
      insertOrderAndOutbox(db, "SBL-2026-000102", "outbox-102");

      let appendCalled = false;
      const mockSheetsWithExisting = {
        spreadsheets: {
          values: {
            get: async ({ range }) => {
              if (range && range.includes("1:1")) {
                return { data: { values: [mapperMod.ORDER_SHEET_HEADERS] } };
              }
              // Column A query (findExistingOrderNumbers)
              return {
                data: {
                  values: [
                    ["Order Number"],
                    ["SBL-2026-000102"], // Order was already recorded in Google Sheets before previous crash
                  ],
                },
              };
            },
            append: async () => {
              appendCalled = true;
              return { data: {} };
            },
          },
        },
      };

      const syncResult = await workerMod.syncOutboxBatch({
        db,
        sheetsClient: mockSheetsWithExisting,
        spreadsheetId: "mock-sheet-id",
        tabName: "Orders",
      });

      ok(syncResult.processed === 1, "Processed candidate record");
      ok(syncResult.skipped === 1, "Skipped duplicate order row (detected in Column A)");
      ok(syncResult.synced === 0, "Synced count is 0 (no append executed)");
      ok(appendCalled === false, "appendOrderRows was NOT called for existing order");

      const updated = db.prepare("SELECT * FROM sheet_sync_outbox WHERE id = ?").get("outbox-102");
      ok(updated.status === "SYNCED", "Record safely marked as SYNCED in SQLite without duplicate append");
      ok(updated.attempts === 1, "Attempts incremented to 1");
    }

    console.log("\n--- 3. Failure Handling & Automatic Retry ---");
    {
      const db = createTestDb();
      insertOrderAndOutbox(db, "SBL-2026-000103", "outbox-103");

      // Run 1: Google API returns transient 503 error
      let attemptCount = 0;
      const mockSheetsFailing = {
        spreadsheets: {
          values: {
            get: async () => ({ data: { values: [mapperMod.ORDER_SHEET_HEADERS] } }),
            append: async () => {
              attemptCount++;
              throw new Error("Google Sheets API 503 Service Unavailable");
            },
          },
        },
      };

      const failResult = await workerMod.syncOutboxBatch({
        db,
        sheetsClient: mockSheetsFailing,
        spreadsheetId: "mock-sheet-id",
        tabName: "Orders",
      });

      ok(failResult.failed === 1, "Record marked as failed on API error");
      ok(failResult.synced === 0, "Synced count is 0");

      const failedRecord = db.prepare("SELECT * FROM sheet_sync_outbox WHERE id = ?").get("outbox-103");
      ok(failedRecord.status === "FAILED", `Record status is FAILED in SQLite (got "${failedRecord.status}")`);
      ok(failedRecord.attempts === 1, "Attempts count is 1");
      ok(failedRecord.last_error.includes("503 Service Unavailable"), `last_error stores API error message: "${failedRecord.last_error}"`);

      // Run 2: Retry with restored connection
      const mockSheetsRecovered = {
        spreadsheets: {
          values: {
            get: async () => ({ data: { values: [mapperMod.ORDER_SHEET_HEADERS] } }),
            append: async () => {
              attemptCount++;
              return { data: { updates: { updatedRows: 1 } } };
            },
          },
        },
      };

      const retryResult = await workerMod.syncOutboxBatch({
        db,
        sheetsClient: mockSheetsRecovered,
        spreadsheetId: "mock-sheet-id",
        tabName: "Orders",
      });

      ok(retryResult.synced === 1, "Failed record successfully recovered and synced on next run");
      ok(retryResult.failed === 0, "No failures on retry");

      const syncedRecord = db.prepare("SELECT * FROM sheet_sync_outbox WHERE id = ?").get("outbox-103");
      ok(syncedRecord.status === "SYNCED", "Record status updated to SYNCED in SQLite");
      ok(syncedRecord.attempts === 2, "Attempts count incremented to 2");
      ok(syncedRecord.last_error === null, "last_error cleared to null");
    }

    console.log("\n--- 4. Stale PROCESSING Recovery ---");
    {
      const db = createTestDb();
      insertOrderAndOutbox(db, "SBL-2026-000104", "outbox-104", "PROCESSING");

      // Set updated_at to 15 minutes ago
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      db.prepare("UPDATE sheet_sync_outbox SET updated_at = ? WHERE id = ?").run(fifteenMinutesAgo, "outbox-104");

      const recoveredCount = workerMod.recoverStaleProcessing(db, 5 * 60 * 1000);
      ok(recoveredCount === 1, `recoverStaleProcessing reset 1 stale record (got ${recoveredCount})`);

      const recoveredRecord = db.prepare("SELECT * FROM sheet_sync_outbox WHERE id = ?").get("outbox-104");
      ok(recoveredRecord.status === "PENDING", `Stale record returned to PENDING status (got "${recoveredRecord.status}")`);

      // Recent PROCESSING record within threshold is NOT recovered
      insertOrderAndOutbox(db, "SBL-2026-000105", "outbox-105", "PROCESSING");
      const recentRecovered = workerMod.recoverStaleProcessing(db, 5 * 60 * 1000);
      ok(recentRecovered === 0, "Active/recent PROCESSING record within 5-min threshold was untouched");
    }

    console.log("\n--- 5. Process-Level Lock File Contention ---");
    {
      const tempLockDir = fs.mkdtempSync(path.join(os.tmpdir(), "sabaland-lock-test-"));
      const testLockPath = path.join(tempLockDir, ".sync-worker.lock");

      // Worker 1 acquires lock
      const releaseLock1 = workerMod.acquireWorkerLock(testLockPath);
      ok(typeof releaseLock1 === "function", "Worker 1 successfully acquired lock file");
      ok(fs.existsSync(testLockPath), "Lock file exists on disk");

      // Worker 2 attempts to acquire same lock
      let worker2Threw = false;
      let errorMsg = "";
      try {
        workerMod.acquireWorkerLock(testLockPath);
      } catch (err) {
        worker2Threw = err instanceof workerMod.LockAcquisitionError;
        errorMsg = err.message;
      }
      ok(worker2Threw, `Worker 2 threw LockAcquisitionError: "${errorMsg}"`);

      // Worker 1 releases lock
      releaseLock1();
      ok(!fs.existsSync(testLockPath), "Lock file removed after release");

      // Worker 2 can now acquire lock
      const releaseLock2 = workerMod.acquireWorkerLock(testLockPath);
      ok(typeof releaseLock2 === "function", "Worker 2 acquired lock after Worker 1 released it");
      releaseLock2();

      fs.rmSync(tempLockDir, { recursive: true, force: true });
    }

    console.log("\n--- 6. SQLite Atomic Row Claim Contention ---");
    {
      const db = createTestDb();
      insertOrderAndOutbox(db, "SBL-2026-000106", "outbox-106");

      // Worker 1 claims
      const claimed1 = workerMod.claimRecord(db, "outbox-106");
      ok(claimed1 === true, "Worker 1 successfully claimed outbox-106 (changes === 1)");

      // Worker 2 attempts to claim same record concurrently
      const claimed2 = workerMod.claimRecord(db, "outbox-106");
      ok(claimed2 === false, "Worker 2 was rejected on already claimed record (changes === 0)");

      // Finish record
      workerMod.markRecordSynced(db, "outbox-106");

      // Worker 2 attempts again after SYNCED
      const claimed3 = workerMod.claimRecord(db, "outbox-106");
      ok(claimed3 === false, "Worker 2 cannot claim already SYNCED record");
    }

    console.log("\n==================================================");
    console.log(`  Phase 3 Tests Completed: ${passed} passed, ${failed} failed`);
    console.log("==================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

main();
